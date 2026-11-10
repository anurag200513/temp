# ADB & Sensor Troubleshooting Guide

## Device Not Detected
1. Enable **Developer Options** and **USB Debugging** on your Android device.
2. Reconnect the USB cable and run `adb devices` to confirm authorization.
3. Accept the RSA fingerprint prompt on the phone screen.

## Wireless ADB Connection
1. Connect via USB once and run `adb tcpip 5555`.
2. Disconnect USB and run `adb connect <DEVICE_IP>:5555`.

## Missing Thermal Zones
Some devices restrict `/sys/class/thermal/` permissions on non-rooted builds. Battery temperature from `dumpsys battery` remains available without root access.
