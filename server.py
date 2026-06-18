import http.server
import socketserver
import json
import subprocess
import time
import os
import sys
import webbrowser
import threading

PORT = 8000

# Cache device detection to avoid running adb too frequently
device_cache = {
    "device_id": None,
    "model": None,
    "last_checked": 0,
    "error": None
}

def check_adb_installed():
    try:
        subprocess.run(['adb', '--version'], capture_output=True, text=True, timeout=1)
        return True
    except Exception:
        return False

def get_adb_device_info():
    global device_cache
    now = time.time()
    # Cache device detection for 3 seconds
    if now - device_cache["last_checked"] < 3.0:
        return device_cache["device_id"], device_cache["model"], device_cache["error"]
    
    device_cache["last_checked"] = now
    
    if not check_adb_installed():
        device_cache["device_id"] = None
        device_cache["model"] = None
        device_cache["error"] = "ADB is not installed or not in PATH"
        return None, None, device_cache["error"]
        
    try:
        result = subprocess.run(['adb', 'devices'], capture_output=True, text=True, timeout=2)
        lines = result.stdout.strip().split('\n')
        devices = []
        for line in lines[1:]:
            if line.strip() and 'device' in line:
                parts = line.split()
                if len(parts) >= 2 and parts[1] == 'device':
                    devices.append(parts[0])
                    
        if not devices:
            device_cache["device_id"] = None
            device_cache["model"] = None
            device_cache["error"] = "No device detected. Connect via USB/Wi-Fi with USB Debugging enabled."
            return None, None, device_cache["error"]
            
        device_id = devices[0]
        # Get device model
        model_result = subprocess.run(['adb', '-s', device_id, 'shell', 'getprop', 'ro.product.model'], capture_output=True, text=True, timeout=2)
        model = model_result.stdout.strip() or device_id
        
        device_cache["device_id"] = device_id
        device_cache["model"] = model
        device_cache["error"] = None
        return device_id, model, None
    except Exception as e:
        device_cache["device_id"] = None
        device_cache["model"] = None
        device_cache["error"] = f"ADB communication error: {str(e)}"
        return None, None, device_cache["error"]

def get_battery_stats(device_id):
    try:
        result = subprocess.run(['adb', '-s', device_id, 'shell', 'dumpsys', 'battery'], capture_output=True, text=True, timeout=2)
        output = result.stdout
        
        stats = {}
        for line in output.split('\n'):
            line = line.strip()
            if ':' in line:
                key, val = line.split(':', 1)
                stats[key.strip()] = val.strip()
                
        # Temperature is in tenths of a degree Celsius (e.g. 362 is 36.2C)
        raw_temp = float(stats.get('temp', 0))
        temp = raw_temp / 10.0 if raw_temp > 0 else 30.0
        
        level = int(stats.get('level', 50))
        voltage = float(stats.get('voltage', 0)) / 1000.0  # Convert mV to V
        
        # Status: 1 Unknown, 2 Charging, 3 Discharging, 4 Not Charging, 5 Full
        status_code = int(stats.get('status', 1))
        status_map = {1: "Unknown", 2: "Charging", 3: "Discharging", 4: "Not Charging", 5: "Full"}
        status = status_map.get(status_code, "Discharging")
        
        # Health: 1 Unknown, 2 Good, 3 Overheat, 4 Dead, 5 Over Voltage, 6 Failure, 7 Cold
        health_code = int(stats.get('health', 1))
        health_map = {1: "Unknown", 2: "Good", 3: "Overheat", 4: "Dead", 5: "Over Voltage", 6: "Failure", 7: "Cold"}
        health = health_map.get(health_code, "Good")
        
        return {
            'battery_temp': temp,
            'level': level,
            'voltage': round(voltage, 2),
            'status': status,
            'health': health
        }
    except Exception:
        return None

def get_cpu_temp(device_id):
    # Try different thermal zones
    paths = [
        "/sys/class/thermal/thermal_zone0/temp",
        "/sys/class/thermal/thermal_zone1/temp",
        "/sys/class/thermal/thermal_zone2/temp",
        "/sys/class/thermal/thermal_zone7/temp",
        "/sys/devices/virtual/thermal/thermal_zone0/temp",
        "/sys/class/thermal/thermal_zone10/temp"
    ]
    for path in paths:
        try:
            result = subprocess.run(['adb', '-s', device_id, 'shell', 'cat', path], capture_output=True, text=True, timeout=1)
            if result.returncode == 0:
                val_str = result.stdout.strip()
                if val_str.isdigit() or (val_str.replace('-','',1).isdigit()):
                    val = float(val_str)
                    # Some devices return temperature in millidegrees (e.g. 45000 is 45C)
                    if val > 1000 or val < -1000:
                        val = val / 1000.0
                    # Standard CPU temp should be roughly within 15C to 95C
                    if 15 <= val <= 95:
                        return round(val, 1)
        except Exception:
            continue
    # Return battery temp + a slight random offset as fallback
    return None

class TemperatureMonitorHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        # API Endpoint for stream
        if self.path == '/api/temp-stream':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            
            # Simulated data state in case ADB fails
            sim_battery_temp = 32.5
            sim_cpu_temp = 40.2
            sim_level = 72
            sim_voltage = 3.85
            sim_status = "Discharging"
            sim_health = "Good"
            
            print("[INFO] SSE Connection opened.")
            try:
                while True:
                    device_id, model, error = get_adb_device_info()
                    data = {}
                    
                    if device_id:
                        stats = get_battery_stats(device_id)
                        if stats:
                            cpu_t = get_cpu_temp(device_id)
                            # If we couldn't read CPU temp, simulate it based on battery temp
                            if cpu_t is None:
                                cpu_t = round(stats['battery_temp'] + 5.0, 1)
                                
                            data = {
                                'mode': 'hardware',
                                'device_id': device_id,
                                'device_name': model,
                                'battery_temp': stats['battery_temp'],
                                'cpu_temp': cpu_t,
                                'battery_level': stats['level'],
                                'voltage': stats['voltage'],
                                'charging_status': stats['status'],
                                'battery_health': stats['health'],
                                'error': None
                            }
                        else:
                            data = {
                                'mode': 'simulator',
                                'device_id': None,
                                'device_name': "Simulator Mode",
                                'battery_temp': 32.0,
                                'cpu_temp': 38.0,
                                'battery_level': 85,
                                'voltage': 3.92,
                                'charging_status': "Discharging",
                                'battery_health': "Good",
                                'error': "ADB error reading battery data. Falling back to simulator."
                            }
                    else:
                        # Fallback / Simulated Data
                        # Slowly fluctuate values
                        import random
                        sim_battery_temp += random.uniform(-0.2, 0.2)
                        sim_battery_temp = max(25.0, min(sim_battery_temp, 55.0))
                        
                        sim_cpu_temp = sim_battery_temp + random.uniform(4.0, 12.0)
                        sim_cpu_temp = max(30.0, min(sim_cpu_temp, 85.0))
                        
                        data = {
                            'mode': 'simulator',
                            'device_id': None,
                            'device_name': "Simulator Device",
                            'battery_temp': round(sim_battery_temp, 1),
                            'cpu_temp': round(sim_cpu_temp, 1),
                            'battery_level': sim_level,
                            'voltage': round(sim_voltage, 2),
                            'charging_status': sim_status,
                            'battery_health': sim_health,
                            'error': error  # Sends the exact reason why ADB is not used
                        }
                    
                    # Send event
                    payload = f"data: {json.dumps(data)}\n\n"
                    self.wfile.write(payload.encode('utf-8'))
                    self.wfile.flush()
                    time.sleep(1.0)
            except Exception as e:
                print(f"[INFO] SSE Connection closed: {e}")
                return
        else:
            # Handle standard files (index.html, style.css, etc.)
            # Map '/' to index.html
            if self.path == '/':
                self.path = '/index.html'
            
            # Avoid directory traversal and just serve local file system
            # Ensure static files are looked up in the current directory or public/
            super().do_GET()

def open_browser():
    time.sleep(1.5)
    print(f"[INFO] Opening dashboard at http://localhost:{PORT}")
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == '__main__':
    # Change working directory to the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Run the server
    handler = TemperatureMonitorHandler
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"[SUCCESS] Real-Time Phone Temperature Monitor Server started on port {PORT}")
        print(f"[INFO] Access local dashboard at: http://localhost:{PORT}")
        print("[INFO] Press Ctrl+C to stop the server.")
        
        # Start browser in a background thread
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] Server shutting down...")
            httpd.shutdown()
            sys.exit(0)
