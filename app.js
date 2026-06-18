// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const batteryTempText = document.getElementById('batteryTempText');
const cpuTempText = document.getElementById('cpuTempText');
const batteryStatusLabel = document.getElementById('batteryStatusLabel');
const cpuStatusLabel = document.getElementById('cpuStatusLabel');
const batteryFahrenheit = document.getElementById('batteryFahrenheit');
const cpuFahrenheit = document.getElementById('cpuFahrenheit');
const batteryProgress = document.getElementById('batteryProgress');
const cpuProgress = document.getElementById('cpuProgress');

const batteryCard = document.getElementById('batteryCard');
const cpuCard = document.getElementById('cpuCard');

const batteryLevelText = document.getElementById('batteryLevelText');
const batteryLevelBar = document.getElementById('batteryLevelBar');
const voltageText = document.getElementById('voltageText');
const voltageStatus = document.getElementById('voltageStatus');
const chargingStatusText = document.getElementById('chargingStatusText');
const chargeIcon = document.getElementById('chargeIcon');
const chargeIconWrapper = document.getElementById('chargeIconWrapper');
const batteryHealthText = document.getElementById('batteryHealthText');
const healthThrottling = document.getElementById('healthThrottling');

const statusDot = document.getElementById('statusDot');
const connectionSource = document.getElementById('connectionSource');
const deviceName = document.getElementById('deviceName');
const adbBadge = document.getElementById('adbBadge');

const tempOverrideSlider = document.getElementById('tempOverrideSlider');
const sliderValueText = document.getElementById('sliderValueText');
const presetBtns = document.querySelectorAll('.preset-btn');

const alertBanner = document.getElementById('alertBanner');
const alertTitle = document.getElementById('alertTitle');
const alertMsg = document.getElementById('alertMsg');
const criticalOverlay = document.getElementById('criticalOverlay');

const logConsole = document.getElementById('logConsole');
const btnClearLogs = document.getElementById('btnClearLogs');
const currentTimeSpan = document.getElementById('currentTime');

const adviceContainer = document.getElementById('adviceContainer');

// Modal Elements
const adbModal = document.getElementById('adbModal');
const btnAdbGuide = document.getElementById('btnAdbGuide');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnModalOk = document.getElementById('btnModalOk');

// Widget Elements
const floatingWidget = document.getElementById('floatingWidget');
const btnLaunchWidget = document.getElementById('btnLaunchWidget');
const btnWidgetSize = document.getElementById('btnWidgetSize');
const btnWidgetStyle = document.getElementById('btnWidgetStyle');
const btnWidgetExpand = document.getElementById('btnWidgetExpand');
const widgetTemp1x1 = document.getElementById('widgetTemp1x1');
const widgetDot1x1 = document.getElementById('widgetDot1x1');
const widgetLabel1x1 = document.getElementById('widgetLabel1x1');
const widgetBatTemp2x1 = document.getElementById('widgetBatTemp2x1');
const widgetCpuTemp2x1 = document.getElementById('widgetCpuTemp2x1');
const widgetLevel2x1 = document.getElementById('widgetLevel2x1');
const widgetCharge2x1 = document.getElementById('widgetCharge2x1');
const widgetTemp2x2 = document.getElementById('widgetTemp2x2');
const widgetCpu2x2 = document.getElementById('widgetCpu2x2');
const widgetFooterDrag = document.getElementById('widgetFooterDrag');
const widgetHeader = document.getElementById('widgetHeader');

// Application State
let liveData = {
    battery_temp: 30.0,
    cpu_temp: 35.0,
    battery_level: 80,
    voltage: 3.85,
    charging_status: "Discharging",
    battery_health: "Good",
    mode: "simulator",
    device_name: "Simulator Device"
};

let currentPreset = 'idle'; // 'idle', 'browsing', 'charging', 'gaming', 'video', 'throttling', 'manual'
let sseSource = null;
let chart = null;
const chartMaxTicks = 20;
let thermalInterpolationInterval = null;

// Widget State
let widgetSize = '2x1'; // '1x1', '2x1', '2x2'
let widgetTheme = 'glass'; // 'glass', 'cyber', 'thermal'
let sparklineChart = null;

// Preset Configuration
const presetsConfig = {
    idle: {
        targetBattery: 29.5,
        targetCpu: 34.0,
        levelChange: 0, // static
        charging: "Discharging",
        voltage: 3.85,
        health: "Good",
        label: "Idle State"
    },
    browsing: {
        targetBattery: 33.2,
        targetCpu: 41.5,
        levelChange: -0.1,
        charging: "Discharging",
        voltage: 3.80,
        health: "Good",
        label: "Social Browsing"
    },
    charging: {
        targetBattery: 41.2,
        targetCpu: 46.8,
        levelChange: 0.5,
        charging: "Charging (Fast)",
        voltage: 4.35,
        health: "Good",
        label: "Fast Charging"
    },
    gaming: {
        targetBattery: 44.8,
        targetCpu: 58.2,
        levelChange: -0.8,
        charging: "Discharging",
        voltage: 3.68,
        health: "Good",
        label: "Heavy Gaming (HDR 90FPS)"
    },
    video: {
        targetBattery: 46.2,
        targetCpu: 62.5,
        levelChange: -0.6,
        charging: "Discharging",
        voltage: 3.70,
        health: "Good",
        label: "4K 60FPS Recording"
    },
    throttling: {
        targetBattery: 52.8,
        targetCpu: 78.5,
        levelChange: 0.2, // charging while gaming
        charging: "Charging",
        voltage: 4.10,
        health: "Overheat",
        label: "Thermal Stress Test"
    }
};

// Initialize Application
function init() {
    setupChart();
    setupEventListeners();
    setupSparkline();
    setupWidgetDragging();
    startSSE();
    startClock();
    startThermalPhysicsLoop();
    addLog("system", "INFO", "ThermaGuard initialized. Monitoring daemon online.");
}

// Setup Event Listeners
function setupEventListeners() {
    // Preset Buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const preset = btn.getAttribute('data-preset');
            setPreset(preset);
        });
    });

    // Temp Slider Manual Override
    tempOverrideSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentPreset = 'manual';
        
        // Remove active presets
        presetBtns.forEach(b => b.classList.remove('active'));
        
        sliderValueText.textContent = `${val.toFixed(1)}°C (Override)`;
        sliderValueText.style.color = "var(--color-warning)";
        
        // Update manual values instantly
        liveData.battery_temp = val;
        // CPU is generally hotter
        liveData.cpu_temp = val + 6.5;
        
        // Update UI
        updateUI();
    });

    // Clear logs
    btnClearLogs.addEventListener('click', () => {
        logConsole.innerHTML = '';
        addLog("system", "INFO", "Console log cleared.");
    });

    // Modals
    const btnTabAdb = document.getElementById('btnTabAdb');
    const btnTabWidget = document.getElementById('btnTabWidget');
    const secAdbGuide = document.getElementById('secAdbGuide');
    const secWidgetGuide = document.getElementById('secWidgetGuide');

    btnAdbGuide.addEventListener('click', () => {
        adbModal.classList.add('open');
        // Reset tabs to default active view
        btnTabAdb.classList.add('active');
        btnTabWidget.classList.remove('active');
        secAdbGuide.classList.add('active');
        secWidgetGuide.classList.remove('active');
    });
    btnCloseModal.addEventListener('click', () => adbModal.classList.remove('open'));
    btnModalOk.addEventListener('click', () => adbModal.classList.remove('open'));
    adbModal.addEventListener('click', (e) => {
        if(e.target === adbModal) adbModal.classList.remove('open');
    });

    btnTabAdb.addEventListener('click', () => {
        btnTabAdb.classList.add('active');
        btnTabWidget.classList.remove('active');
        secAdbGuide.classList.add('active');
        secWidgetGuide.classList.remove('active');
    });

    btnTabWidget.addEventListener('click', () => {
        btnTabWidget.classList.add('active');
        btnTabAdb.classList.remove('active');
        secWidgetGuide.classList.add('active');
        secAdbGuide.classList.remove('active');
    });

    // Widget Mode Controls
    btnLaunchWidget.addEventListener('click', () => {
        document.body.classList.add('widget-mode-active');
        floatingWidget.style.display = 'flex';
        // Center the widget
        floatingWidget.style.top = '35%';
        floatingWidget.style.left = '50%';
        floatingWidget.style.transform = 'translate(-50%, -50%)';
        addLog("system", "SUCCESS", "Entered Floating Widget view.");
    });

    btnWidgetExpand.addEventListener('click', () => {
        document.body.classList.remove('widget-mode-active');
        floatingWidget.style.display = 'none';
        addLog("system", "INFO", "Restored full dashboard.");
    });

    btnWidgetSize.addEventListener('click', cycleWidgetSize);
    btnWidgetStyle.addEventListener('click', cycleWidgetTheme);
}

// Setup Chart.js
function setupChart() {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    // Create gradients
    const batteryGrad = ctx.createLinearGradient(0, 0, 0, 200);
    batteryGrad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
    batteryGrad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    const cpuGrad = ctx.createLinearGradient(0, 0, 0, 200);
    cpuGrad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    cpuGrad.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(chartMaxTicks).fill(''),
            datasets: [
                {
                    label: 'Battery Temp (°C)',
                    data: Array(chartMaxTicks).fill(null),
                    borderColor: '#00f2fe',
                    borderWidth: 2,
                    backgroundColor: batteryGrad,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: 'CPU Temp (°C)',
                    data: Array(chartMaxTicks).fill(null),
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    backgroundColor: cpuGrad,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { display: false }
                },
                y: {
                    min: 20,
                    max: 85,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Space Grotesk' },
                        callback: function(value) { return value + '°C'; }
                    }
                }
            },
            animation: { duration: 200 }
        }
    });
}

// Update Chart Data
function updateChart(batVal, cpuVal) {
    if(!chart) return;
    
    // Add current timestamp for label
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    chart.data.labels.shift();
    chart.data.labels.push(timeLabel);
    
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(batVal);

    chart.data.datasets[1].data.shift();
    chart.data.datasets[1].data.push(cpuVal);
    
    chart.update();
}

// Start Server-Sent Events (SSE) Client
function startSSE() {
    if(sseSource) {
        sseSource.close();
    }
    
    addLog("network", "INFO", "Connecting to hardware telemetry server...");
    
    sseSource = new EventSource('/api/temp-stream');
    
    sseSource.onopen = () => {
        addLog("network", "SUCCESS", "SSE Link connected to backend.");
        statusDot.className = 'status-dot pulse';
        statusDot.style.color = 'var(--color-normal)';
    };
    
    sseSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // If in manual or preset override mode, ignore incoming SSE data for values,
            // but still show the hardware connection stats
            updateConnectionUI(data);
            
            if (currentPreset === 'manual') {
                return; // let manual override rule
            }
            
            if (currentPreset !== 'none' && data.mode === 'hardware') {
                // If a real device connects, break simulator preset lock
                currentPreset = 'none';
                presetBtns.forEach(b => b.classList.remove('active'));
                sliderValueText.textContent = "Off (SSE Active)";
                sliderValueText.style.color = "var(--text-muted)";
                addLog("system", "INFO", `Physical device '${data.device_name}' detected. Terminating simulation.`);
            }

            if (currentPreset === 'none') {
                liveData = data;
                updateUI();
            }
        } catch (e) {
            console.error("Error parsing SSE data:", e);
        }
    };
    
    sseSource.onerror = (err) => {
        statusDot.className = 'status-dot';
        statusDot.style.color = 'var(--color-critical)';
        connectionSource.textContent = "Offline";
        deviceName.textContent = "No server connection";
        
        adbBadge.className = 'adb-badge badge-danger';
        adbBadge.textContent = "LINK DOWN";
        
        // If SSE fails, fall back to Simulator mode inside client
        if (currentPreset === 'none') {
            currentPreset = 'idle';
            presetBtns.forEach(b => {
                if(b.getAttribute('data-preset') === 'idle') b.classList.add('active');
                else b.classList.remove('active');
            });
            addLog("network", "WARN", "Telemetry server went offline. Switched to local simulator.");
        }
    };
}

// Update connection details UI
function updateConnectionUI(data) {
    if(data.mode === 'hardware') {
        connectionSource.textContent = "Android USB";
        deviceName.textContent = data.device_name;
        adbBadge.className = 'adb-badge badge-success';
        adbBadge.textContent = "ACTIVE";
    } else {
        connectionSource.textContent = "Simulator";
        deviceName.textContent = "Simulated Device";
        if(data.error && data.error.includes("ADB is not installed")) {
            adbBadge.className = 'adb-badge badge-danger';
            adbBadge.textContent = "NO ADB";
        } else {
            adbBadge.className = 'adb-badge badge-warning';
            adbBadge.textContent = "STANDBY";
        }
    }
}

// Set Simulator Preset
function setPreset(preset) {
    currentPreset = preset;
    
    // Reset manual slider override text
    sliderValueText.textContent = "Off (Simulation Active)";
    sliderValueText.style.color = "var(--text-muted)";
    
    const config = presetsConfig[preset];
    if (config) {
        addLog("simulator", "INFO", `Triggering workload: ${config.label}`);
        
        // Set basic non-temperature states instantly
        liveData.charging_status = config.charging;
        liveData.voltage = config.voltage;
        liveData.battery_health = config.health;
        
        // Let the physics loop smoothly interpolate temperature to avoid sudden jumps on chart
    }
}

// Thermodynamic interpolation loop
function startThermalPhysicsLoop() {
    setInterval(() => {
        if (currentPreset === 'none') {
            // Live data is handled directly by SSE, just stream directly to chart
            updateChart(liveData.battery_temp, liveData.cpu_temp);
            return; 
        }
        
        if (currentPreset === 'manual') {
            // Live manual updates, just stream directly to chart
            updateChart(liveData.battery_temp, liveData.cpu_temp);
            return;
        }
        
        // Simulator presets interpolation logic
        const config = presetsConfig[currentPreset];
        if (config) {
            // Smoothly move current temperature towards target temperature (inertia physics)
            const bTempDiff = config.targetBattery - liveData.battery_temp;
            liveData.battery_temp += bTempDiff * 0.12; // move 12% closer per tick
            
            const cTempDiff = config.targetCpu - liveData.cpu_temp;
            liveData.cpu_temp += cTempDiff * 0.15; // CPU reacts faster than battery
            
            // Adjust battery level based on discharge rate
            if(config.levelChange !== 0) {
                liveData.battery_level = Math.max(1, Math.min(100, liveData.battery_level + config.levelChange));
            }
            
            // Apply slight random fluctuations for realism
            liveData.battery_temp += (Math.random() - 0.5) * 0.1;
            liveData.cpu_temp += (Math.random() - 0.5) * 0.3;
            
            // Round values
            liveData.battery_temp = Math.round(liveData.battery_temp * 10) / 10;
            liveData.cpu_temp = Math.round(liveData.cpu_temp * 10) / 10;
            liveData.battery_level = Math.round(liveData.battery_level);
            
            updateUI();
            updateChart(liveData.battery_temp, liveData.cpu_temp);
        }
    }, 1000);
}

// Update HTML Interface with current state
let lastLoggedThrottling = false;
let lastLoggedNormal = true;
let lastThermalLevel = 'normal';

function updateUI() {
    const bTemp = liveData.battery_temp;
    const cTemp = liveData.cpu_temp;
    
    // Celsius values
    batteryTempText.textContent = bTemp.toFixed(1);
    cpuTempText.textContent = cTemp.toFixed(1);
    
    // Fahrenheit conversions
    batteryFahrenheit.textContent = `${Math.round(bTemp * 1.8 + 32)}°F`;
    cpuFahrenheit.textContent = `${Math.round(cTemp * 1.8 + 32)}°F`;
    
    // SVG Progress Arc adjustments
    // stroke-dasharray is 502 (2 * Math.PI * 80). Offset represents empty space.
    // Map Battery Temperature (0°C to 60°C)
    const batPercent = Math.max(0, Math.min(100, (bTemp / 60) * 100));
    const batOffset = 502 - (502 * batPercent) / 100;
    batteryProgress.style.strokeDashoffset = batOffset;
    
    // Map CPU Temperature (0°C to 100°C)
    const cpuPercent = Math.max(0, Math.min(100, (cTemp / 100) * 100));
    const cpuOffset = 502 - (502 * cpuPercent) / 100;
    cpuProgress.style.strokeDashoffset = cpuOffset;
    
    // Determine status levels
    const batteryLevelInfo = getThermalLevel(bTemp, 'battery');
    const cpuLevelInfo = getThermalLevel(cTemp, 'cpu');
    
    // Apply Battery class
    batteryCard.className = `glass-card gauge-card theme-${batteryLevelInfo.level}`;
    batteryStatusLabel.textContent = batteryLevelInfo.label;
    
    // Apply CPU class
    cpuCard.className = `glass-card gauge-card theme-${cpuLevelInfo.level}`;
    cpuStatusLabel.textContent = cpuLevelInfo.label;
    
    // Critical alert threshold trigger (Battery > 45°C or CPU > 70°C)
    const isOverheating = batteryLevelInfo.level === 'critical' || cpuLevelInfo.level === 'critical';
    
    if(isOverheating) {
        criticalOverlay.classList.add('active');
        alertBanner.style.display = 'flex';
        alertTitle.textContent = "Thermal Warning: Overheating Active!";
        alertMsg.textContent = `Dangerous core thermal profile. Battery: ${bTemp}°C | CPU: ${cTemp}°C. CPU throttling active.`;
        
        if(!lastLoggedThrottling) {
            addLog("thermal", "CRITICAL", `Thermal Throttling Engaged. Bat: ${bTemp}°C, CPU: ${cTemp}°C`);
            lastLoggedThrottling = true;
            lastLoggedNormal = false;
        }
    } else {
        criticalOverlay.classList.remove('active');
        if(bTemp < 38.0 && cTemp < 50.0) {
            alertBanner.style.display = 'none';
            if(!lastLoggedNormal) {
                addLog("thermal", "SUCCESS", `Thermal levels normalized. Throttling disengaged.`);
                lastLoggedNormal = true;
                lastLoggedThrottling = false;
            }
        }
    }
    
    // Update mini stats
    batteryLevelText.textContent = `${liveData.battery_level}%`;
    batteryLevelBar.style.width = `${liveData.battery_level}%`;
    
    // Dynamic charge color based on level
    if(liveData.battery_level < 20) batteryLevelBar.style.background = 'var(--color-critical)';
    else if(liveData.battery_level < 50) batteryLevelBar.style.background = 'var(--color-warning)';
    else batteryLevelBar.style.background = 'linear-gradient(to right, #3b82f6, #00f2fe)';
    
    voltageText.textContent = `${liveData.voltage.toFixed(2)} V`;
    voltageStatus.textContent = liveData.voltage > 4.2 ? "High Draw" : liveData.voltage < 3.6 ? "Low Voltage" : "Optimal";
    
    chargingStatusText.textContent = liveData.charging_status;
    
    // Adjust plug icons/classes
    if(liveData.charging_status !== "Discharging" && liveData.charging_status !== "Unknown") {
        chargeIcon.setAttribute('data-lucide', 'zap');
        chargeIconWrapper.className = "stat-icon icon-yellow";
        const rate = liveData.charging_status.includes("Fast") ? "Quick Charge" : "Slow Charge";
        document.getElementById('chargeRate').textContent = rate;
    } else {
        chargeIcon.setAttribute('data-lucide', 'plug');
        chargeIconWrapper.className = "stat-icon icon-green";
        document.getElementById('chargeRate').textContent = "Discharging";
    }
    
    batteryHealthText.textContent = liveData.battery_health;
    healthThrottling.textContent = liveData.battery_health === "Overheat" ? "THROTTLED" : "Good Cond.";
    if(liveData.battery_health === "Overheat") {
        healthThrottling.style.color = "var(--color-critical)";
    } else {
        healthThrottling.style.color = "var(--text-secondary)";
    }
    
    // Update advice cards
    updateAdvice(bTemp, cTemp);

    // Update Widget metrics
    updateWidgetUI(bTemp, cTemp);
    
    lucide.createIcons();
}

// Get Thermal levels categorization
function getThermalLevel(temp, type) {
    if (type === 'battery') {
        if (temp < 30) return { level: 'cool', label: 'OPTIMAL' };
        if (temp < 38) return { level: 'normal', label: 'WARM' };
        if (temp < 45) return { level: 'warning', label: 'ELEVATED' };
        return { level: 'critical', label: 'OVERHEAT' };
    } else { // CPU
        if (temp < 38) return { level: 'cool', label: 'EFFICIENT' };
        if (temp < 50) return { level: 'normal', label: 'NORMAL' };
        if (temp < 70) return { level: 'warning', label: 'LOADED' };
        return { level: 'critical', label: 'THROTTLED' };
    }
}

// Generate thermodynamic advice tips
function updateAdvice(bTemp, cTemp) {
    let adviceHtml = '';
    
    if (bTemp >= 45 || cTemp >= 70) {
        adviceHtml = `
            <div class="advice-item critical">
                <i data-lucide="alert-triangle"></i>
                <p><strong>Emergency Thermal Action:</strong> Turn off fast charging immediately. Charging under extreme temperatures degrades the battery capacity irreversibly.</p>
            </div>
            <div class="advice-item critical">
                <i data-lucide="shield-alert"></i>
                <p><strong>Reduce SoC Duty Cycle:</strong> Close graphic-intensive games, video capture, and high resolution streams. Your CPU is throttling clock speeds to cool down.</p>
            </div>
            <div class="advice-item warning">
                <i data-lucide="airplay"></i>
                <p><strong>Environment Transfer:</strong> Remove your phone cover/case to increase heat dissipation. Place the phone in front of a fan or on a cold table.</p>
            </div>
        `;
    } else if (bTemp >= 38 || cTemp >= 50) {
        adviceHtml = `
            <div class="advice-item warning">
                <i data-lucide="sun"></i>
                <p><strong>High Ambient Warning:</strong> Check if the phone is exposed to direct sunlight. Avoid placing the screen face up under heavy sun conditions.</p>
            </div>
            <div class="advice-item warning">
                <i data-lucide="cpu"></i>
                <p><strong>Background Activity:</strong> Large background installations or cloud syncs are running. Limit background network updates to lower active core cycles.</p>
            </div>
            <div class="advice-item info">
                <i data-lucide="brightness"></i>
                <p><strong>Display Settings:</strong> Screen brightness is a major contributor to thermal load. Consider lowering brightness by 20% or enabling Auto Brightness.</p>
            </div>
        `;
    } else {
        adviceHtml = `
            <div class="advice-item info">
                <i data-lucide="check-circle-2"></i>
                <p><strong>Thermodynamic Status Ideal:</strong> Battery & CPU are running in their optimal health zones. Charging efficiency is currently maximized.</p>
            </div>
            <div class="advice-item info">
                <i data-lucide="battery-charging"></i>
                <p><strong>Charge Advice:</strong> It is safe to use Quick Charge modes. The temperature has ample headroom before any thermal degradation occurs.</p>
            </div>
        `;
    }
    
    adviceContainer.innerHTML = adviceHtml;
}

// Append log to log console
function addLog(source, level, msg) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const line = document.createElement('div');
    line.className = `log-line log-${level.toLowerCase()}`;
    
    line.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-tag">[${source}]</span>
        <span class="log-msg">${msg}</span>
    `;
    
    logConsole.appendChild(line);
    // Auto Scroll to bottom
    logConsole.scrollTop = logConsole.scrollHeight;
}

// Start Clock in Sidebar
function startClock() {
    setInterval(() => {
        const now = new Date();
        currentTimeSpan.textContent = now.toLocaleTimeString([], { hour12: false });
    }, 1000);
}

// Run Initialization
document.addEventListener('DOMContentLoaded', init);

// Widget Helper Functions
function cycleWidgetSize() {
    const contents = ['1x1', '2x1', '2x2'];
    let idx = contents.indexOf(widgetSize);
    idx = (idx + 1) % contents.length;
    widgetSize = contents[idx];

    // Reset size classes
    floatingWidget.classList.remove('widget-size-1x1', 'widget-size-2x1', 'widget-size-2x2');
    floatingWidget.classList.add(`widget-size-${widgetSize}`);

    // Toggle panel displays
    document.getElementById('widgetContent1x1').classList.remove('size-active');
    document.getElementById('widgetContent2x1').classList.remove('size-active');
    document.getElementById('widgetContent2x2').classList.remove('size-active');
    
    document.getElementById(`widgetContent${widgetSize}`).classList.add('size-active');
    
    addLog("simulator", "INFO", `Widget resized to: ${widgetSize}`);
}

function cycleWidgetTheme() {
    const themes = ['glass', 'cyber', 'thermal'];
    let idx = themes.indexOf(widgetTheme);
    idx = (idx + 1) % themes.length;
    widgetTheme = themes[idx];

    floatingWidget.classList.remove('widget-theme-glass', 'widget-theme-cyber', 'widget-theme-thermal');
    floatingWidget.classList.add(`widget-theme-${widgetTheme}`);

    // Clean dynamic thermal classes if switching away
    if (widgetTheme !== 'thermal') {
        floatingWidget.classList.remove('widget-cool', 'widget-normal', 'widget-warning', 'widget-critical');
    }

    addLog("simulator", "INFO", `Widget visual theme: ${widgetTheme.toUpperCase()}`);
}

function updateWidgetUI(bTemp, cTemp) {
    const bLevel = getThermalLevel(bTemp, 'battery');

    // 1x1 size data
    if (widgetTemp1x1) widgetTemp1x1.textContent = bTemp.toFixed(1);
    if (widgetLabel1x1) widgetLabel1x1.textContent = bLevel.label;
    if (widgetDot1x1) {
        // Apply color color dynamically
        widgetDot1x1.className = `widget-dot pulse`;
        widgetDot1x1.style.color = `var(--color-${bLevel.level})`;
        widgetDot1x1.style.backgroundColor = `var(--color-${bLevel.level})`;
    }

    // 2x1 size data
    if (widgetBatTemp2x1) widgetBatTemp2x1.textContent = bTemp.toFixed(1);
    if (widgetCpuTemp2x1) widgetCpuTemp2x1.textContent = cTemp.toFixed(1);
    if (widgetLevel2x1) widgetLevel2x1.textContent = `${liveData.battery_level}%`;
    if (widgetCharge2x1) widgetCharge2x1.textContent = liveData.charging_status;

    // 2x2 size data
    if (widgetTemp2x2) widgetTemp2x2.textContent = bTemp.toFixed(1);
    if (widgetCpu2x2) widgetCpu2x2.textContent = cTemp.toFixed(1);

    // Apply color parameters if using thermal theme
    if (widgetTheme === 'thermal') {
        floatingWidget.classList.remove('widget-cool', 'widget-normal', 'widget-warning', 'widget-critical');
        floatingWidget.classList.add(`widget-${bLevel.level}`);
    }

    // Update Sparkline Chart data
    if (sparklineChart) {
        sparklineChart.data.datasets[0].data.shift();
        sparklineChart.data.datasets[0].data.push(bTemp);
        sparklineChart.update('none'); // Update without full animation
    }
}

function setupSparkline() {
    const canvas = document.getElementById('widgetSparkline');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
    grad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
    
    sparklineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(15).fill(''),
            datasets: [{
                data: Array(15).fill(null),
                borderColor: '#00f2fe',
                borderWidth: 1.5,
                backgroundColor: grad,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false, min: 20, max: 70 }
            }
        }
    });
}

function setupWidgetDragging() {
    if (!floatingWidget) return;
    
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    const handles = [widgetHeader, widgetFooterDrag];

    handles.forEach(handle => {
        if (!handle) return;
        handle.addEventListener('mousedown', dragStart);
        handle.addEventListener('touchstart', dragStart, { passive: true });
    });

    function dragStart(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        isDragging = true;
        floatingWidget.style.cursor = 'grabbing';
        
        // Remove translation center positioning to prevent alignment offsets when absolute positioned
        floatingWidget.style.transform = 'none';
        
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        startX = clientX;
        startY = clientY;
        
        const rect = floatingWidget.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        if (e.cancelable) e.preventDefault();
        
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        let dx = clientX - startX;
        let dy = clientY - startY;
        
        floatingWidget.style.left = `${initialX + dx}px`;
        floatingWidget.style.top = `${initialY + dy}px`;
        floatingWidget.style.right = 'auto';
        floatingWidget.style.bottom = 'auto';
    }
    
    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        floatingWidget.style.cursor = 'grab';
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
    }
}
