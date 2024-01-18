import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4.7.1/+esm";

if (typeof browser === "undefined") {
  var browser = chrome;
}

function randomString(length) {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

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
let key = "";
let isHost = false;

browser.storage.local.get(["key", "lastUsed"]).then((data) => {
  data.lastUsed = parseInt(data.lastUsed || 0);
  if (data.lastUsed < Date.now() - 1000 * 60 * 5) data.key = randomString(32);
  key = data.key;
  browser.storage.local.set({ key });
});

setInterval(() => browser.storage.local.set({ lastUsed: Date.now() }), 5000);

browser.runtime.onMessage.addListener((message) => {
  if (!ws) return;
  if (lastVideoId === message.videoId) return;

  if (message.event === "navigate") {
    lastVideoId = message.videoId;
    ws.emit("load", message.videoId, Math.round(Date.now()) + 5 * 1000);
    if (isHost) setTimeout(() => sendToTabs({ event: "play", time: 0 }), 5000);
  }
  if (message.event === "play") ws.emit("play", message.time);
  if (message.event === "pause") ws.emit("pause");
});

const DEV_URL = "ws://localhost:12372";
const PROD_URL = "wss://ytwt.tobycm.dev";
const DEBUG = false;
const URL = DEBUG ? DEV_URL : PROD_URL;

let ws;

function connect(roomId) {
  browser.storage.local.set({ roomId });

  ws = io(URL, {
    forceNew: true,
    transports: ["websocket"],
    auth: {
      key: key,
    },
    query: {
      roomId,
    },
  });

  ws.on("error", console.error);
  ws.on("connect", () => log("Connected to server"));
  ws.on("host", () => {
    log("I am the host :D");
    isHost = true;
  });
  ws.on("load", (videoId, startAt) => {
    if (lastVideoId === videoId) return;
    log("Loading video", videoId);
    sendToTabs({ event: "changeVideo", videoId });
    setTimeout(
      () => sendToTabs({ event: "play", time: 0 }),
      startAt - Math.round(Date.now())
    );
  });
  ws.on("play", (time) => sendToTabs({ event: "play", time }));
  ws.on("pause", () => sendToTabs({ event: "pause" }));
}

log("Loaded background script");
