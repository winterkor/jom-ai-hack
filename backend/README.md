# Backend (placeholder)

This directory is reserved for the API server that will:

1. Receive live occupancy updates from ESP32 rack sensors (MQTT or HTTP)
2. Proxy LTA DataMall calls so the API key isn't exposed to the frontend
3. Store historical rack usage for the activity heatmap feature
4. Flag abandoned bikes (rack slot occupied >N days with no change)

**Not implemented yet.** Empty for now — the webapp talks directly to LTA DataMall and uses mock occupancy.
