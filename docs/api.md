# Server-Sent Events (SSE) API Reference

`server.py` exposes a local HTTP static server alongside a real-time thermal telemetry stream.

## Endpoints

### `GET /events`
Streams JSON-encoded thermal sensor snapshots over `text/event-stream`.

Example payload:
```json
{
  "battery_temp": 34.5,
  "cpu_temp": 46.2,
  "status": "normal",
  "timestamp": 1730900000
}
```
