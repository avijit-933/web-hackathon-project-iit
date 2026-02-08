/****************************
 * INITIALIZE DASHBOARD
 ****************************/
document.addEventListener("DOMContentLoaded", () => {
    hideLoading();
    initDashboard();
    setupEventListeners();
    startRealTimeUpdates();
});

/****************************
 * LOADING SCREEN
 ****************************/
function hideLoading() {
    setTimeout(() => {
        const screen = document.getElementById("loading-screen");
        if (!screen) return;
        screen.style.opacity = "0";
        setTimeout(() => screen.style.display = "none", 500);
    }, 1500);
}

/****************************
 * API FETCH (ONLY SOURCE)
 ****************************/
async function getAsteroids() {
    const response = await fetch("/asteroids/");
    if (!response.ok) throw new Error("Failed to fetch asteroid data");
    return await response.json();
}


/****************************
 * DASHBOARD INIT
 ****************************/
async function initDashboard() {
    updateTime();
    await updateStats();
    await loadAsteroids();
    setupRiskAnalysis();
}

/****************************
 * TIME
 ****************************/
function updateTime() {
    const now = new Date().toUTCString().split(" ")[4];
    document.getElementById("current-time").textContent = `${now} UTC`;
    document.getElementById("last-updated").textContent = `${now} UTC`;
    setTimeout(updateTime, 1000);
}

/****************************
 * STATS (FROM API)
 ****************************/
async function updateStats() {
    try {
        const asteroids = await getAsteroids();

        const hazardous = asteroids.filter(a => a.hazardous).length;
        const largest = Math.max(...asteroids.map(a => a.diameter));
        const fastest = Math.max(...asteroids.map(a => a.velocity));

        document.getElementById("hazardous-count").textContent = hazardous;
        document.getElementById("active-asteroids").textContent = asteroids.length;
        document.getElementById("largest-neo").textContent = `${largest.toFixed(2)} km`;
        document.getElementById("fastest-neo").textContent = `${fastest.toFixed(2)} km/s`;

        updateRiskScore(asteroids);

    } catch (err) {
        console.error(err);
        showNotification("Failed to update stats", "error");
    }
}

/****************************
 * LOAD ASTEROIDS LIST
 ****************************/
async function loadAsteroids() {
    const asteroids = await getAsteroids();
    const container = document.getElementById("asteroids-list");
    container.innerHTML = "";

    asteroids.forEach(a => {
        container.appendChild(createAsteroidElement(a));
    });
}

/****************************
 * ASTEROID CARD
 ****************************/
function createAsteroidElement(a) {
    const div = document.createElement("div");
    div.className = "asteroid-item";
    div.dataset.id = a.id;

    div.innerHTML = `
        <div class="asteroid-header">
            <span class="asteroid-name">${a.name}</span>
            <span class="hazard-badge ${a.hazardous ? "hazardous" : "safe"}">
                ${a.hazardous ? "Hazardous" : "Safe"}
            </span>
        </div>
        <div class="asteroid-details">
            <div><b>Diameter:</b> ${a.diameter} km</div>
            <div><b>Distance:</b> ${(a.distance * 149.6).toFixed(2)} M km</div>
            <div><b>Velocity:</b> ${a.velocity} km/s</div>
        </div>
    `;
    return div;
}

/****************************
 * FILTER / SEARCH / SORT
 ****************************/
function setupEventListeners() {
    document.getElementById("refresh-data").addEventListener("click", refreshData);

    document.getElementById("asteroid-search").addEventListener("input", e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll(".asteroid-item").forEach(item => {
            item.style.display =
                item.textContent.toLowerCase().includes(term) ? "flex" : "none";
        });
    });
}

/****************************
 * RISK ANALYSIS
 ****************************/
function setupRiskAnalysis() {
    updateRiskFactors([10, 15, 10]);
}

function updateRiskScore(asteroids) {
    let proximity = 0, size = 0, speed = 0;

    asteroids.forEach(a => {
        if (a.distance < 0.005) proximity += 10;
        if (a.diameter > 0.05) size += 15;
        if (a.velocity > 25) speed += 10;
    });

    updateRiskFactors([
        Math.min(proximity, 40),
        Math.min(size, 35),
        Math.min(speed, 25)
    ]);
}

function updateRiskFactors(values) {
    const total = values.reduce((a, b) => a + b, 0);
    document.getElementById("risk-score-value").textContent = total;
}

/****************************
 * REFRESH
 ****************************/
async function refreshData() {
    await updateStats();
    await loadAsteroids();
    showNotification("Data refreshed", "success");
}

/****************************
 * NOTIFICATIONS
 ****************************/
function showNotification(msg, type) {
    const div = document.createElement("div");
    div.className = `notification ${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

/****************************
 * REAL TIME UPDATES
 ****************************/
function startRealTimeUpdates() {
    setInterval(updateStats, 30000);
}