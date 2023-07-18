if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "sendEvent") {
    const result = message.data;
    sendEvent(result);
  }
});

function sendEvent(data) {
  if (ws.readyState != ws.OPEN) return;

  log("Sending message", data);
  ws.send(data);
}

var ws = new WebSocket(`ws://localhost:12372/tobycm1`);

ws.addEventListener("error", console.error);

ws.addEventListener("open", () => {
  log("Connected to server");
  sendEvent(JSON.stringify({ event: "connect" }));
});

let just = {
  play: false,
  pause: false,
  seek: false,
};

function sendJust() {
  browser.tabs.query({ active: true }, function (tabs) {
    tabs.forEach((tab) => {
      browser.tabs.sendMessage(tab.id, { event: "just", just });
    });
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "just") {
    just = message.just;
  }
});

ws.addEventListener("message", async (event) => {
  let eventData = event.data;

  if (event.data instanceof Blob) {
    eventData = await event.data.text();
  }
  const { event: eventName, data } = JSON.parse(eventData);

  log("Received message", eventName, data || "");

  switch (eventName) {
    case "host":
      browser.storage.local.set({ key: data });
      break;
    case "invalid_key":
      browser.storage.local.remove("key");
    case "load":
      browser.tabs.query({ active: true }, function (tabs) {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, {
            event: "changeVideo",
            videoId: data,
          });
        });
      });
      break;
    case "play":
      just.play = true;
      sendJust();
      play(data.time);
      break;
    case "pause":
      just.pause = true;
      sendJust();
      pause();
      break;
    case "seek":
      just.seek = true;
      sendJust();
      seekTo(data);
      break;
  }
});

log("Loaded background script");
