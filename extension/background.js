import { io } from "./socket.io/socket.io.esm.min.js";

if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

function sendToTabs(message) {
  browser.tabs.query({ active: true }, (tabs) =>
    tabs.forEach((tab) => browser.tabs.sendMessage(tab.id, message))
  );
}

browser.runtime.onMessage.addListener((message) => {
  if (message.event === "joinRoom") {
    connect(message.roomId);
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (!ws) return;
  switch (message.event) {
    case "navigate":
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

const DEV_URL = "ws://localhost:12372/";
const PROD_URL = "wss://ytwt.tobycm.systems/";

const URL = false ? PROD_URL : DEV_URL;

let ws;

function connect(roomId) {
  ws = io(URL, {
    forceNew: true,
  });

  ws.on("error", console.error);
  ws.on("invalid_key", () => browser.storage.local.remove("key"));
  ws.on("host", (key) => browser.storage.local.set({ key }));
  ws.on("load", (videoId) =>
    sendToTabs({
      event: "changeVideo",
      videoId,
    })
  );
  ws.on("play", (time) => sendToTabs({ event: "play", data: time }));
  ws.on("pause", () => sendToTabs({ event: "pause" }));
  ws.on("seek", (time) => sendToTabs({ event: "seek", data: time }));

  log("Connected to server");
  ws.emit("join", roomId);
}

log("Loaded background script");
