document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLocation(); 
    initSequestration();
    initFootprint();
});

// --- 1. NAVIGATION LOGIC (SPA TAB SWITCHING) ---
function initNavigation() {
    const buttons = document.querySelectorAll('.menu-btn');
    const sections = document.querySelectorAll('.view-section');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            sections.forEach(sec => sec.classList.add('hidden'));
            sections.forEach(sec => sec.classList.remove('active'));

            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        });
    });
}

// --- 2. LOCATION & SEARCH LOGIC ---
function initLocation() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const city = document.getElementById('cityInput').value;
            if (city) getCoordinates(city);
        });
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => updateDashboard(pos.coords.latitude, pos.coords.longitude, "Your Location"),
            () => updateDashboard(51.50, -0.12, "London (Default)")
        );
    }
}

async function getCoordinates(city) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country } = data.results[0];
            updateDashboard(latitude, longitude, `${name}, ${country}`);
        } else {
            alert("City not found.");
        }
    } catch (err) { console.error(err); }
}

function updateDashboard(lat, lon, label) {
    document.getElementById('location-display').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${label}`;
    fetchWeather(lat, lon);
    fetchAirQuality(lat, lon);
}

// --- 3. API FETCHING WITH LOADING STATES ---
async function fetchWeather(lat, lon) {
    const tempEl = document.getElementById('temp-val');
    const humEl = document.getElementById('humid-val');
    const windEl = document.getElementById('wind-val');

    // Loading State
    tempEl.innerHTML = '<div class="spinner"></div>';
    humEl.innerHTML = '<div class="spinner"></div>';
    windEl.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=precipitation_probability_mean&timezone=auto`);
        const data = await res.json();

        tempEl.innerText = `${data.current_weather.temperature}°C`;
        windEl.innerText = `${data.current_weather.windspeed} km/h`;
        humEl.innerText = "76%"; // Mock data for demo

        renderRainChart(data.daily.precipitation_probability_mean, data.daily.time);
    } catch (err) { 
        console.error(err);
        tempEl.innerText = "--";
    }
}

async function fetchAirQuality(lat, lon) {
    const pmEl = document.getElementById('pm25-val');
    const no2El = document.getElementById('no2-val');
    
    pmEl.innerHTML = '<div class="spinner"></div>';
    no2El.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,nitrogen_dioxide,ozone&timezone=auto`);
        const data = await res.json();
        const current = data.current;

        pmEl.innerText = `${current.pm2_5} µg/m³`;
        no2El.innerText = `${current.nitrogen_dioxide} µg/m³`;
        renderAirChart(current);
    } catch (err) { 
        console.error(err);
        pmEl.innerText = "--";
    }
}

// --- 4. PREMIUM CHART RENDERERS ---
let rainChart = null;
function renderRainChart(dataPoints, labels) {
    const ctx = document.getElementById('rainfallChart').getContext('2d');
    const shortLabels = labels.map(d => new Date(d).toLocaleDateString('en-US', {weekday: 'short'}));

    // Gradient Fill
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 137, 123, 0.5)'); 
    gradient.addColorStop(1, 'rgba(0, 137, 123, 0.0)'); 

    if (rainChart) rainChart.destroy();

    rainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: shortLabels,
            datasets: [{
                label: 'Rain %',
                data: dataPoints,
                borderColor: '#00897b',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.4, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#f0f0f0', borderDash: [5, 5] }, ticks: { color: '#888' } },
                x: { grid: { display: false }, ticks: { color: '#888' } }
            }
        }
    });
}

let airChart = null;
function renderAirChart(data) {
    const ctx = document.getElementById('airQualityRadar').getContext('2d');
    if (airChart) airChart.destroy();

    airChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['PM10', 'PM2.5', 'NO2', 'Ozone'],
            datasets: [{
                label: 'Pollutants',
                data: [data.pm10, data.pm2_5, data.nitrogen_dioxide, data.ozone],
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderColor: '#dc3545',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { grid: { color: '#eee' }, ticks: { display: false } } }
        }
    });
}

// --- 5. CALCULATORS ---
function initSequestration() {
    const tIn = document.getElementById('treeInput');
    const sIn = document.getElementById('soilInput');
    
    function update() {
        document.getElementById('tree-count').innerText = tIn.value;
        document.getElementById('soil-count').innerText = sIn.value;
        document.getElementById('sequestrationResult').innerText = ((tIn.value * 0.022) + (sIn.value * 0.0004)).toFixed(3);
    }
    tIn.addEventListener('input', update);
    sIn.addEventListener('input', update);
}

function initFootprint() {
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    document.getElementById('calculate-footprint-btn').addEventListener('click', () => {
        const selected = document.querySelectorAll('.option-btn.selected');
        if (selected.length < 3) return alert("Please answer all 3 questions.");
        
        let score = 0;
        let tips = [];
        selected.forEach(btn => {
            score += parseInt(btn.getAttribute('data-score'));
            if(btn.getAttribute('data-tip')) tips.push(btn.getAttribute('data-tip'));
        });

        document.getElementById('footprint-result').classList.remove('hidden');
        document.getElementById('impact-score').innerText = score + "/90";
        document.getElementById('impact-message').innerText = score < 30 ? "🌱 Excellent Work!" : "⚠️ Action Needed";
        
        const list = document.getElementById('tips-list');
        list.innerHTML = "";
        tips.forEach(t => {
            const li = document.createElement('li');
            li.innerText = t;
            list.appendChild(li);
        });
    });
}