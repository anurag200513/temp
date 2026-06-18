# ThermaGuard // Real-Time Phone Temperature Monitor

ThermaGuard is an ultra-premium, real-time device temperature monitoring dashboard. It connects directly to your Android device via USB/Wi-Fi Debugging using **Android Debug Bridge (ADB)** to extract live battery and CPU thermal sensor data. It features a zero-dependency Python backend server and a sleek, glassmorphic dashboard UI with live line charts, dynamic alert states, a thermodynamic simulation console, and an advisory cooling module.

---

## ⚡ Architecture Flow

The system operates as a client-server architecture with an Android device daemon.

```mermaid
graph TD
    subgraph Android Device (Hardware)
        A[Battery Sensor /dumpsys battery/] -->|ADB Shell Command| C
        B[CPU Thermal Zones /sys/class/thermal/] -->|ADB Shell Command| C
    end

    subgraph PC (Local Server)
        C[Python Backend Daemon - server.py] -->|Server-Sent Events / SSE| D[Static HTTP Server - Port 8000]
    end

    subgraph Browser (Frontend)
        D -->|JSON Stream| E[Glassmorphic UI Dashboard]
        E -->|Render Gauges & Alerts| F[SVG Progress Rings]
        E -->|Plot Real-time Graphs| G[Chart.js Line Chart]
        E -->|Thermodynamic Preset Controls| H[Physics Simulator Engine]
    end
```

---

## 🚀 Key Features

*   **Real-Time Hardware Diagnostics:** Pulls active battery and CPU thermal metrics directly from your Android phone's kernel sensors.
*   **Dual Gauges:** Circular SVG progress meters showing Battery and CPU Core temperatures with dynamic color-coding (Cool &rarr; Normal &rarr; Warm &rarr; Overheat).
*   **Live Trend Line Chart:** Scrolling multi-dataset line chart plotting battery and core temperature history over the last 60 seconds.
*   **Physics-Based Workload Simulator:** A built-in simulator engine allowing you to trigger profiles (Gaming, 4K Recording, Fast Charging, Thermal Stress Test) to watch temperature values rise and fall smoothly following simulated thermal inertia.
*   **Emergency Thermal Alerts:** A screen-wide flashing red heat pulse overlay and warning banner if the phone crosses critical heat levels (>45°C battery or >70°C CPU).
*   **Thermodynamic Event Log:** Console logs recording diagnostic details, connection drops, charging cycles, and throttling status.
*   **Dynamic Cooling Assistant:** Evaluates temperatures and recommends mitigation steps (e.g. lowering brightness, shutting camera streams, disabling fast charger).

---

## 📦 Getting Started

### Prerequisites

*   **Python 3.x** installed.
*   **Android Debug Bridge (ADB)** installed on your machine and added to your system's Environment Variables (PATH).
    *   *Windows:* Download ADB from [Android developer portal](https://developer.android.com/studio/releases/platform-tools) and add the folder path to system Path.
    *   *macOS/Linux:* Install via Homebrew (`brew install android-platform-tools`) or apt (`sudo apt install adb`).

---

## 🔌 Connecting Your Phone

1.  **Enable Developer Options:**
    On your Android phone, go to **Settings > About Phone** and tap **Build Number** 7 times until you see the toast *"You are now a developer!"*.
2.  **Enable USB Debugging:**
    Go to **Settings > System > Developer Options** and switch **USB Debugging** to ON.
3.  **Connect to PC:**
    Connect your phone via USB. Make sure USB configuration is set to **"File Transfer"** or **"MTP"**.
4.  **Authorize connection:**
    Unlock your phone screen. Accept the dialog prompt asking *"Allow USB Debugging?"* by checking **"Always allow from this computer"** and tapping **Allow**.

---

## 🏃 Running the Monitor

1.  Open your terminal inside the workspace directory (`d:\phone temp`).
2.  Start the zero-dependency Python server:
    ```powershell
    python server.py
    ```
3.  The console will log startup status:
    ```text
    [SUCCESS] Real-Time Phone Temperature Monitor Server started on port 8000
    [INFO] Access local dashboard at: http://localhost:8000
    [INFO] Opening dashboard at http://localhost:8000
    ```
4.  Your default web browser will automatically open to `http://localhost:8000`.
5.  If a device is connected, the dashboard source indicator will light up green and display your phone model (e.g., *Pixel 7 Pro* or *Samsung Galaxy S23*). If no device is connected, it runs in **Simulator Mode** automatically, letting you play with presets.

---

## 🛠️ File Structure

*   [`server.py`](file:///d:/phone%20temp/server.py) - Zero-dependency Python web server that reads ADB stats and exposes static routes and SSE APIs.
*   [`index.html`](file:///d:/phone%20temp/index.html) - Structural dashboard layouts with gages, cards, simulators, and modals.
*   [`style.css`](file:///d:/phone%20temp/style.css) - Vanilla CSS stylesheet containing glassmorphic styling, glowing text, sliders, and animation keyframes.
*   [`app.js`](file:///d:/phone%20temp/app.js) - Client script handling SSE parsing, line-charts, physics calculations for presets, and console log streams.

---

## ❓ Troubleshooting

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Dashboard shows "Simulator Device"** | Phone USB Debugging not enabled, or ADB isn't in PATH. | 1. Ensure `adb devices` in terminal lists your device serial.<br>2. Re-plug USB and accept debugging prompt on phone.<br>3. Check if ADB PATH is set. |
| **"NO ADB" status badge** | ADB command is not installed on PC. | Install ADB Platform Tools and add it to system environment variables. |
| **Logs show "ADB communication error"** | Conflict in ADB server daemon. | Restart ADB in your terminal using:<br>`adb kill-server`<br>`adb start-server` |
| **CPU Temp shows same as Battery Temp** | Phone kernel blocks CPU file-system accesses. | Android devices secure `/sys/class/thermal` paths differently. The server automatically falls back to battery sensor temp + 5°C to maintain graph visualization stability. |

---

## 📱 Permanent Android Home Screen Widget

To place a live-updating temperature widget directly on your phone's home screen permanently:

1. **Get your PC's IP Address**:
   * On Windows: Open Command Prompt and run `ipconfig` (look for `IPv4 Address` under your active connection, e.g. `192.168.1.104`).
   * On macOS/Linux: Open Terminal and run `ifconfig` or `ip a`.
2. **Ensure Same Wi-Fi Connection**:
   * Both your PC (running the server) and your Android phone must be connected to the same Wi-Fi router.
3. **Install a Web Widget App**:
   * Open the Google Play Store on your Android phone.
   * Search for and install a free web widget app (such as **Web Widget** by lowlevel, or **Widgetizer**).
4. **Add and Configure the Widget**:
   * Long-press your home screen and add a new widget from the app you just downloaded.
   * In the widget settings, paste the URL pointing to the dedicated widget file on your PC:
     ```text
     http://<your-pc-ip>:8000/widget.html
     ```
   * Set the refresh interval (e.g., 2 seconds, or let the SSE stream maintain real-time updates depending on the app).
5. **Enjoy**:
   * The widget features a glassmorphic transparent background that blends with your wallpaper and updates itself automatically in real-time as thermal values change!

