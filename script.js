/* ---------- GLOBAL ---------- */

let currentUser = "";
let spaces = [];
let selectedSpaceIndex = null;

let weekChart = null;

const DEFAULT_TIMER_MINUTES = 25;
const TIMER_DURATIONS = [5, 10, 25, 50];
const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

let currentWeekStart = getISODate(getWeekStart(new Date()));
let selectedTimerMinutes = DEFAULT_TIMER_MINUTES;
let timerSeconds = selectedTimerMinutes * 60;
let timerInterval = null;

/* ---------- ELEMENTS ---------- */
const passwordInput = document.getElementById("passwordInput");
const registerBtn = document.getElementById("registerBtn");
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const settingsLogoutBtn = document.getElementById("settingsLogoutBtn");

const helloText = document.getElementById("helloText");
const sidebarUser = document.getElementById("sidebarUser");
const settingsUser = document.getElementById("settingsUser");

const createSpaceBtn = document.getElementById("createSpaceBtn");
const openModal = document.getElementById("openModal");
const emptyCreateBtn = document.getElementById("emptyCreateBtn");

const cardsContainer = document.getElementById("cardsContainer");
const spacesList = document.getElementById("spacesList");
const emptyBox = document.getElementById("emptyBox");

const habitsSection = document.getElementById("habitsSection");
const spaceTitle = document.getElementById("spaceTitle");
const spaceDescription = document.getElementById("spaceDescription");
const addHabitBtn = document.getElementById("addHabitBtn");
const habitsContainer = document.getElementById("habitsContainer");
const weekLabels = document.getElementById("weekLabels");
const currentWeekText = document.getElementById("currentWeekText");
const prevWeekBtn = document.getElementById("prevWeekBtn");
const todayWeekBtn = document.getElementById("todayWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");

const streakText = document.getElementById("streakText");

const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");
const testNotificationBtn = document.getElementById("testNotificationBtn");
const notificationStatus = document.getElementById("notificationStatus");

const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const timerOptionButtons = document.querySelectorAll(".timer-option");

const clearDataBtn = document.getElementById("clearDataBtn");

function getStartOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
    const nextDate = getStartOfDay(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

function getWeekStart(date) {
    const start = getStartOfDay(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    return addDays(start, diff);
}

function getISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateFromISO(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function getTodayKey() {
    return getISODate(new Date());
}

function getCurrentWeekStartKey() {
    return getISODate(getWeekStart(new Date()));
}

function getWeekDates(weekStartKey = currentWeekStart) {
    const start = getDateFromISO(weekStartKey);

    return DAY_NAMES.map((dayName, index) => {
        const date = addDays(start, index);

        return {
            dayName,
            date,
            dateKey: getISODate(date)
        };
    });
}

function formatShortDate(date) {
    return String(date.getDate()).padStart(2, "0") + "." +
        String(date.getMonth() + 1).padStart(2, "0");
}

function formatWeekRange(weekDates) {
    return formatShortDate(weekDates[0].date) + " - " +
        formatShortDate(weekDates[6].date);
}

function isTodayKey(dateKey) {
    return dateKey === getTodayKey();
}

function isFutureKey(dateKey) {
    return getDateFromISO(dateKey) > getStartOfDay(new Date());
}

function isPastKey(dateKey) {
    return getDateFromISO(dateKey) < getStartOfDay(new Date());
}

function normalizeTimerMinutes(minutes) {
    const parsedMinutes = Number(minutes);

    return TIMER_DURATIONS.includes(parsedMinutes) ? parsedMinutes : DEFAULT_TIMER_MINUTES;
}
function getUsers() {
    return JSON.parse(localStorage.getItem("goalpath_users")) || {};
}

function saveUsers(users) {
    localStorage.setItem("goalpath_users", JSON.stringify(users));
}

function saveData() {
    const users = getUsers();

    if (!currentUser || !users[currentUser]) return;

    users[currentUser].spaces = spaces;
    users[currentUser].timerMinutes = selectedTimerMinutes;
    users[currentUser].calendarWeekStart = currentWeekStart;

    saveUsers(users);
}

function loadData() {
    const users = getUsers();
    const user = users[currentUser];

    spaces = user.spaces || [];
    selectedTimerMinutes = normalizeTimerMinutes(user.timerMinutes);
    timerSeconds = selectedTimerMinutes * 60;
    currentWeekStart = user.calendarWeekStart || getCurrentWeekStartKey();

    migrateSpacesToDateCompletions();
    saveData();
    updateTimerDisplay();
    renderTimerOptions();
}

function migrateSpacesToDateCompletions() {
    const migrationWeekDates = getWeekDates(getCurrentWeekStartKey());

    spaces.forEach(space => {
        if (!Array.isArray(space.habits)) {
            space.habits = [];
        }

        space.habits.forEach(habit => {
            if (!habit.completions || Array.isArray(habit.completions)) {
                habit.completions = {};
            }

            if (Array.isArray(habit.days)) {
                habit.days.forEach((day, index) => {
                    if (day === 1 && migrationWeekDates[index]) {
                        habit.completions[migrationWeekDates[index].dateKey] = true;
                    }
                });

                delete habit.days;
            }

            if (!habit.createdAt) {
                habit.createdAt = getTodayKey();
            }
        });
    });
}

function register() {
    const name = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (name === "" || password === "") {
        alert("Введите имя и пароль");
        return;
    }

    const users = getUsers();

    if (users[name]) {
        alert("Такой пользователь уже существует");
        return;
    }

    users[name] = {
        password: password,
        spaces: [],
        timerMinutes: DEFAULT_TIMER_MINUTES,
        calendarWeekStart: getCurrentWeekStartKey()
    };

    saveUsers(users);

    alert("Аккаунт создан! Теперь войдите.");
}

function login() {
    const name = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (name === "" || password === "") {
        alert("Введите имя и пароль");
        return;
    }

    const users = getUsers();

    if (!users[name]) {
        alert("Пользователь не найден. Сначала зарегистрируйтесь.");
        return;
    }

    if (users[name].password !== password) {
        alert("Неверный пароль");
        return;
    }

    currentUser = name;
    localStorage.setItem("goalpath_current_user", currentUser);

    loadData();
    showApp();
}

function logout() {
    pauseTimer(false);
    localStorage.removeItem("goalpath_current_user");

    currentUser = "";
    spaces = [];
    selectedSpaceIndex = null;

    app.classList.add("hidden");
    loginScreen.classList.remove("hidden");

    usernameInput.value = "";
    passwordInput.value = "";
}function showApp() {
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    helloText.innerText = "Привет, " + currentUser + " 👋";
    sidebarUser.innerText = currentUser;
    settingsUser.innerText = currentUser;

    renderAll();
}

/* ---------- NAVIGATION ---------- */

function openPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById(pageName + "Page").classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    document.querySelector(`.nav-link[data-page="${pageName}"]`).classList.add("active");

    if (pageName === "stats") {
        renderCharts();
    }
}

/* ---------- SPACES ---------- */

function createSpace() {
    const title = prompt("Введите название спейса:");

    if (!title || title.trim() === "") return;

    const description = prompt("Введите описание спейса:") || "Личная цель";

    spaces.push({
        title: title.trim(),
        description: description.trim(),
        habits: []
    });

    selectedSpaceIndex = spaces.length - 1;

    saveData();
    renderAll();
}

function deleteSpace(index) {
    if (!confirm("Удалить этот спейс со всеми привычками?")) return;

    spaces.splice(index, 1);

    selectedSpaceIndex = spaces.length > 0 ? 0 : null;

    saveData();
    renderAll();
}

function selectSpace(index) {
    selectedSpaceIndex = index;
    renderAll();
}

/* ---------- HABITS ---------- */

function addHabit() {
    if (selectedSpaceIndex === null) {
        alert("Сначала выберите или создайте спейс");
        return;
    }

    const habitName = prompt("Введите название привычки:");

    if (!habitName || habitName.trim() === "") return;

    spaces[selectedSpaceIndex].habits.push({
        name: habitName.trim(),
        completions: {},
        createdAt: getTodayKey()
    });

    saveData();
    renderAll();
}

function toggleDay(habitIndex, dateKey) {
    const habit = spaces[selectedSpaceIndex].habits[habitIndex];

    if (isFutureKey(dateKey)) return;

    if (!habit.completions) {
        habit.completions = {};
    }

    if (habit.completions[dateKey]) {
        delete habit.completions[dateKey];
    } else {
        habit.completions[dateKey] = true;
    }

    saveData();
    renderAll();
}

function deleteHabit(habitIndex) {
    if (!confirm("Удалить эту привычку?")) return;

    spaces[selectedSpaceIndex].habits.splice(habitIndex, 1);

    saveData();
    renderAll();
}

function changeWeek(days) {
    currentWeekStart = getISODate(addDays(getDateFromISO(currentWeekStart), days));

    saveData();
    renderAll();
}

function showCurrentWeek() {
    currentWeekStart = getCurrentWeekStartKey();

    saveData();
    renderAll();
}

/* ---------- CALCULATIONS ---------- */

function getSpaceProgress(space) {
    let total = 0;
    let done = 0;
    const weekDates = getWeekDates();

    space.habits.forEach(habit => {
        weekDates.forEach(day => {
            if (isFutureKey(day.dateKey)) return;

            total++;
            if (habit.completions && habit.completions[day.dateKey]) done++;
        });
    });

    if (total === 0) return 0;

    return Math.round((done / total) * 100);
}

function getWeekData(space) {
    const week = [0, 0, 0, 0, 0, 0, 0];
    const weekDates = getWeekDates();

    space.habits.forEach(habit => {
        weekDates.forEach((day, index) => {
            if (habit.completions && habit.completions[day.dateKey]) {
                week[index]++;
            }
        });
    });

    return week;
}

function getBestStreak(space) {
    let best = 0;
    let current = 0;
    let previousDate = null;
    const completedDates = new Set();

    space.habits.forEach(habit => {
        Object.keys(habit.completions || {}).forEach(dateKey => {
            if (habit.completions[dateKey]) {
                completedDates.add(dateKey);
            }
        });
    });

    Array.from(completedDates).sort().forEach(dateKey => {
        const date = getDateFromISO(dateKey);

        if (previousDate) {
            const dayDiff = Math.round((date - previousDate) / (24 * 60 * 60 * 1000));
            current = dayDiff === 1 ? current + 1 : 1;
        } else {
            current = 1;
        }

        best = Math.max(best, current);
        previousDate = date;
    });

    return best;
}

/* ---------- RENDER ---------- */

function renderAll() {
    renderSpaces();
    renderHabits();
    renderCharts();
}

function renderSpaces() {
    cardsContainer.innerHTML = "";
    spacesList.innerHTML = "";

    if (spaces.length === 0) {
        emptyBox.classList.remove("hidden");
        habitsSection.classList.add("hidden");
        return;
    }

    emptyBox.classList.add("hidden");

    if (selectedSpaceIndex === null) {
        selectedSpaceIndex = 0;
    }

    spaces.forEach((space, index) => {
        const progress = getSpaceProgress(space);

        cardsContainer.innerHTML += `
            <div class="card" onclick="selectSpace(${index})">
                <button class="delete-space" onclick="event.stopPropagation(); deleteSpace(${index})">×</button>
                <h2>${space.title}</h2>
                <p>${space.description}</p>
                <div class="progress-circle">${progress}%</div>
            </div>
        `;

        spacesList.innerHTML += `
            <div class="space-item" onclick="selectSpace(${index})">
                ${space.title}
            </div>
        `;
    });
}

function renderWeekHeader() {
    const weekDates = getWeekDates();

    currentWeekText.innerText = formatWeekRange(weekDates);

    weekLabels.innerHTML = weekDates.map(day => {
        const stateClass = isTodayKey(day.dateKey)
            ? "today"
            : isFutureKey(day.dateKey)
                ? "future"
                : "past";

        return `
            <span class="week-day-label ${stateClass}">
                <strong>${day.dayName}</strong>
                <small>${formatShortDate(day.date)}</small>
            </span>
        `;
    }).join("") + "<span></span>";
}

function renderHabits() {
    if (spaces.length === 0 || selectedSpaceIndex === null) {
        habitsSection.classList.add("hidden");
        return;
    }

    habitsSection.classList.remove("hidden");

    const space = spaces[selectedSpaceIndex];

    spaceTitle.innerText = space.title;
    spaceDescription.innerText = space.description;
    renderWeekHeader();

    habitsContainer.innerHTML = "";

    if (space.habits.length === 0) {
        habitsContainer.innerHTML = `
            <div class="empty-habits">
                Пока нет привычек. Нажмите “Добавить привычку”.
            </div>
        `;
        return;
    }

    space.habits.forEach((habit, habitIndex) => {
        let daysHTML = "";
        const weekDates = getWeekDates();

        weekDates.forEach(day => {
            const isDone = Boolean(habit.completions && habit.completions[day.dateKey]);
            const isFuture = isFutureKey(day.dateKey);
            const dayClasses = [
                "day",
                isDone ? "active done" : "",
                isTodayKey(day.dateKey) ? "today" : "",
                isFuture ? "future" : "",
                isPastKey(day.dateKey) ? "past" : ""
            ].filter(Boolean).join(" ");
            const status = isDone ? "выполнено" : isFuture ? "будущий день" : "не выполнено";

            daysHTML += `
                <div class="${dayClasses}" title="${formatShortDate(day.date)}: ${status}" onclick="toggleDay(${habitIndex}, '${day.dateKey}')">
                    ${isDone ? "✓" : ""}
                </div>
            `;
        });

        habitsContainer.innerHTML += `
            <div class="habit">
                <div>
                    <h3>${habit.name}</h3>
                </div>

                <div class="days">
                    ${daysHTML}
                </div>

                <button class="delete-habit" onclick="deleteHabit(${habitIndex})">
                    Удалить
                </button>
            </div>
        `;
    });
}
function renderCharts() {
    const weekCanvas = document.getElementById("weekChart");

    if (!weekCanvas || typeof Chart === "undefined") return;

    if (weekChart) {
        weekChart.destroy();
    }

    if (spaces.length === 0 || selectedSpaceIndex === null) {
        streakText.innerText = "0 дней";
        return;
    }

    const space = spaces[selectedSpaceIndex];
    const weekData = getWeekData(space);
    const weekDates = getWeekDates();
    const streak = getBestStreak(space);

    streakText.innerText = streak + " дней";

    weekChart = new Chart(weekCanvas, {
        type: "line",
        data: {
            labels: weekDates.map(day => day.dayName + " " + formatShortDate(day.date)),
            datasets: [{
                label: "Выполнено привычек",
                data: weekData,
                borderColor: "#ff67b3",
                backgroundColor: "rgba(255, 103, 179, 0.18)",
                pointBackgroundColor: "#ff67b3",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.45,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff",
                        font: {
                            size: 13,
                            family: "Sora"
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#d6d6d6",
                        font: {
                            family: "Sora"
                        }
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#d6d6d6",
                        stepSize: 1,
                        font: {
                            family: "Sora"
                        }
                    },
                    grid: {
                        color: "rgba(255,255,255,0.06)"
                    }
                }
            }
        }
    });
}
/* ---------- NOTIFICATIONS ---------- */

function updateNotificationStatus() {
    if (!("Notification" in window)) {
        notificationStatus.innerText = "Статус: браузер не поддерживает уведомления";
        return;
    }

    notificationStatus.innerText = "Статус: " + Notification.permission;
}

function enableNotifications() {
    if (!("Notification" in window)) {
        alert("Ваш браузер не поддерживает уведомления");
        return;
    }

    Notification.requestPermission().then(permission => {
        updateNotificationStatus();

        if (permission === "granted") {
            showNotification("GoalPath", "Уведомления включены 💗");
        }
    });
}

function showToast(title, text) {
    let toastContainer = document.querySelector(".toast-container");

    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <strong>${title}</strong>
        <p>${text}</p>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showNotification(title, text) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
            body: text
        });
    }

    showToast(title, text);
}

function testNotification() {
    showNotification("GoalPath", "Не забудь отметить привычки сегодня!");
}

/* ---------- TIMER ---------- */

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerDisplay.innerText =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    updateTimerControls();
}

function renderTimerOptions() {
    timerOptionButtons.forEach(button => {
        const minutes = Number(button.dataset.minutes);

        button.classList.toggle("active", minutes === selectedTimerMinutes);
        button.disabled = Boolean(timerInterval);
    });

    updateTimerControls();
}

function updateTimerControls() {
    if (!startTimerBtn) return;

    const fullDuration = selectedTimerMinutes * 60;

    if (timerInterval) {
        startTimerBtn.innerText = "Идет";
        return;
    }

    startTimerBtn.innerText = timerSeconds > 0 && timerSeconds < fullDuration
        ? "Продолжить"
        : "Старт";
}

function updateTimerStatus(text) {
    timerStatus.innerText = text;
}

function selectTimerDuration(minutes) {
    selectedTimerMinutes = normalizeTimerMinutes(minutes);
    pauseTimer(false);
    timerSeconds = selectedTimerMinutes * 60;

    updateTimerDisplay();
    updateTimerStatus("Выбрано " + selectedTimerMinutes + " мин");
    renderTimerOptions();
    saveData();
}

function startTimer() {
    if (timerInterval) return;

    if (timerSeconds <= 0) {
        timerSeconds = selectedTimerMinutes * 60;
    }

    updateTimerStatus("Таймер идет");

    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();

        if (timerSeconds <= 0) {
            timerSeconds = 0;
            updateTimerDisplay();
            clearInterval(timerInterval);
            timerInterval = null;
            updateTimerStatus("Таймер завершен");
            renderTimerOptions();
            showNotification("GoalPath", "Таймер на " + selectedTimerMinutes + " мин завершен!");
        }
    }, 1000);

    renderTimerOptions();
    updateTimerControls();
}

function pauseTimer(showStatus = true) {
    const wasRunning = Boolean(timerInterval);

    clearInterval(timerInterval);
    timerInterval = null;
    renderTimerOptions();
    updateTimerControls();

    if (showStatus && wasRunning) {
        updateTimerStatus("Пауза");
    }
}

function resetTimer() {
    pauseTimer();
    timerSeconds = selectedTimerMinutes * 60;
    updateTimerDisplay();
    updateTimerStatus("Таймер сброшен");
}

/* ---------- SETTINGS ---------- */

function clearUserData() {
    if (!confirm("Очистить все спейсы и привычки этого пользователя?")) return;

    const users = getUsers();

    if (!users[currentUser]) return;

    spaces = [];
    selectedSpaceIndex = null;
    selectedTimerMinutes = DEFAULT_TIMER_MINUTES;
    timerSeconds = selectedTimerMinutes * 60;
    currentWeekStart = getCurrentWeekStartKey();

    users[currentUser].spaces = [];
    users[currentUser].timerMinutes = selectedTimerMinutes;
    users[currentUser].calendarWeekStart = currentWeekStart;

    saveUsers(users);
    updateTimerDisplay();
    renderTimerOptions();
    renderAll();
}

/* ---------- EVENTS ---------- */

loginBtn.addEventListener("click", login);
registerBtn.addEventListener("click", register);
logoutBtn.addEventListener("click", logout);
settingsLogoutBtn.addEventListener("click", logout);

createSpaceBtn.addEventListener("click", createSpace);
openModal.addEventListener("click", createSpace);
emptyCreateBtn.addEventListener("click", createSpace);

addHabitBtn.addEventListener("click", addHabit);

prevWeekBtn.addEventListener("click", () => changeWeek(-7));
todayWeekBtn.addEventListener("click", showCurrentWeek);
nextWeekBtn.addEventListener("click", () => changeWeek(7));

clearDataBtn.addEventListener("click", clearUserData);

enableNotificationsBtn.addEventListener("click", enableNotifications);
testNotificationBtn.addEventListener("click", testNotification);

startTimerBtn.addEventListener("click", startTimer);
pauseTimerBtn.addEventListener("click", () => pauseTimer());
resetTimerBtn.addEventListener("click", resetTimer);

timerOptionButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectTimerDuration(button.dataset.minutes);
    });
});

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        openPage(link.dataset.page);
    });
});

usernameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        login();
    }
});

/* ---------- START ---------- */

updateTimerDisplay();
renderTimerOptions();
updateNotificationStatus();

const savedUser = localStorage.getItem("goalpath_current_user");

if (savedUser && getUsers()[savedUser]) {
    currentUser = savedUser;
    loadData();
    showApp();
} else {
    localStorage.removeItem("goalpath_current_user");
}
