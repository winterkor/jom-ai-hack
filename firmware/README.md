# Firmware (placeholder)

This directory is reserved for the ESP32 device code. Each smart rack runs:

1. Occupancy sensor (ultrasonic, IR, or weight-based per slot)
2. LED indicator strip showing rack fullness from afar
3. Wifi uplink to the backend reporting `{ rackId, occupiedSlots, timestamp }`

**Not implemented yet.** Empty for now.

Likely toolchain: PlatformIO + Arduino framework, or ESP-IDF.
