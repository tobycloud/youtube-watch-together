import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4.7.1/+esm";

if (typeof browser === "undefined") {
  var browser = chrome;
}

// keeping this service worker alive
async function createOffscreen() {
  await chrome.offscreen
    .createDocument({
      url: "offscreen.html",
      reasons: ["BLOBS"],
      justification: "keep service worker running",
    })
    .catch(() => {});
}
chrome.runtime.onStartup.addListener(createOffscreen);
self.onmessage = (e) => {}; // keepAlive
createOffscreen();

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

function sendToTabs(message) {
  browser.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) =>
    tabs.forEach((tab) => browser.tabs.sendMessage(tab.id, message))
  );
}

browser.runtime.onMessage.addListener((message) => {
  if (message.event === "joinRoom") connect(message.roomId);
});

let lastVideoId = "";
let lastKey;

browser.storage.local.get("key").then((value) => (lastKey = value.key));

browser.runtime.onMessage.addListener((message) => {
  if (!ws) return;
  if (lastVideoId === message.videoId) return;
  log("Received message from extension:", message);

  switch (message.event) {
    case "initKey":
      if (lastKey === message.key) return;
      lastKey = message.key;
    case "navigate":
      if (lastVideoId === message.videoId) return;
      lastVideoId = message.videoId;
      ws.emit("load", message.videoId, lastKey);
    case "play":
      ws.emit("play", message.time, Date.now() * 1000, lastKey);
      break;
    case "pause":
      ws.emit("pause", lastKey);
      break;
  }
});

const DEV_URL = "ws://localhost:12372";
const PROD_URL = "wss://ytwt.tobycm.systems";
const DEBUG = false;
const URL = DEBUG ? DEV_URL : PROD_URL;

let ws;

function connect(roomId) {
  ws = io(URL, {
    forceNew: true,
    transports: ["websocket"],
  });

  ws.on("error", console.error);
  ws.on("connect", () => {
    log("Connected to server");
    ws.emit("join", roomId);
  });
  ws.on("host", (key) => {
    log("Received host key:", key);
    lastKey = key;
  });
  ws.on("load", (videoId) => {
    log("Loading video", videoId);
    sendToTabs({ event: "changeVideo", videoId });
  });
  ws.on("play", (time, currentTime) => {
    time = time + (Date.now() * 1000 - currentTime) / 1000;
    log("Received play event and sync at", time);
    sendToTabs({ event: "play", time });
  });
  ws.on("pause", () => {
    log("Received pause event");
    sendToTabs({ event: "pause" });
  });
}

log("Loaded background script");
