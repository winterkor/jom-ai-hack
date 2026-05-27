// Thin singleton wrapper around mqtt.js for HiveMQ Cloud over WSS.
//
// Why a singleton: the lock-session UI may mount/unmount many times during a
// session (nav flow, parked card, lock-session card all observe the same
// state). We want one persistent broker connection, not one per component.
//
// Safe-by-default: if VITE_MQTT_URL is unset (e.g. teammate clones without
// .env.local), the client becomes a no-op so the rest of the app still runs.

import mqtt from "mqtt";

const URL = import.meta.env.VITE_MQTT_URL;
const USER = import.meta.env.VITE_MQTT_USER;
const PASS = import.meta.env.VITE_MQTT_PASS;
const TOPIC_STATE = import.meta.env.VITE_MQTT_TOPIC_STATE || "esp32/door/state";

let client = null;
let connState = "disconnected"; // disconnected | connecting | connected | error | disabled
const stateListeners = new Set();
const connListeners = new Set();
let lastLockState = null;

function notifyConn(next) {
  connState = next;
  for (const cb of connListeners) {
    try {
      cb(next);
    } catch (err) {
      console.warn("mqtt conn listener threw:", err);
    }
  }
}

function notifyState(payload) {
  lastLockState = payload;
  for (const cb of stateListeners) {
    try {
      cb(payload);
    } catch (err) {
      console.warn("mqtt state listener threw:", err);
    }
  }
}

export function connect() {
  if (!URL) {
    notifyConn("disabled");
    return;
  }
  if (client) return; // already wired

  notifyConn("connecting");
  client = mqtt.connect(URL, {
    username: USER,
    password: PASS,
    // Hackathon-acceptable: short reconnect so the demo recovers fast if the
    // laptop's WiFi blinks. Real prod would back off.
    reconnectPeriod: 2000,
    connectTimeout: 8000,
    clean: true,
  });

  client.on("connect", () => {
    notifyConn("connected");
    client.subscribe(TOPIC_STATE, { qos: 0 }, (err) => {
      if (err) console.warn("mqtt subscribe failed:", err.message);
    });
  });

  client.on("reconnect", () => notifyConn("connecting"));
  client.on("close", () => notifyConn("disconnected"));
  client.on("error", (err) => {
    console.warn("mqtt error:", err.message);
    notifyConn("error");
  });

  client.on("message", (topic, payload) => {
    if (topic !== TOPIC_STATE) return;
    // Payload is a Buffer; ESP32 publishes "locked" / "unlocked".
    const text = payload.toString().trim().toLowerCase();
    if (text === "locked" || text === "unlocked") {
      notifyState(text);
    }
  });
}

export function onLockState(cb) {
  stateListeners.add(cb);
  if (lastLockState) cb(lastLockState); // replay latest for late subscribers
  return () => stateListeners.delete(cb);
}

export function onConnectionState(cb) {
  connListeners.add(cb);
  cb(connState);
  return () => connListeners.delete(cb);
}

export function getConnectionState() {
  return connState;
}
