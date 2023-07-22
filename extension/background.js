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
  if (message.event === "joinRoom") {
    connect(message.roomId);
  }
});

let lastVideoId = "";

browser.runtime.onMessage.addListener((message) => {
  if (!ws) return;
  if (lastVideoId === message.videoId) return;
  log("Received message from extension:", message);

  switch (message.event) {
    case "navigate":
      if (lastVideoId === message.videoId) return;
      lastVideoId = message.videoId;
      ws.emit("load", message.videoId, message.key);
    case "play":
      ws.emit("play", message.time, message.key);
      break;
    case "pause":
      ws.emit("pause", message.key);
      break;
    case "seek":
      ws.emit("seek", message.time, message.key);
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
  ws.on("invalid_key", () => {
    log("Invalid key");
    browser.storage.local.remove("key");
  });
  ws.on("host", (key) => {
    log("Received host key:", key);
    browser.storage.local.set({ key });
  });
  ws.on("load", (videoId) => {
    log("Received load event:", videoId);
    sendToTabs({ event: "changeVideo", videoId });
  });
  ws.on("play", (time) => {
    log("Received play event:", time);
    sendToTabs({ event: "play", time });
  });
  ws.on("pause", () => {
    log("Received pause event");
    sendToTabs({ event: "pause" });
  });
  ws.on("seek", (time) => {
    log("Received seek event:", time);
    sendToTabs({ event: "seek", time });
  });
}

log("Loaded background script");
