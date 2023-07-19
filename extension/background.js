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

var ws = new WebSocket(`wss://ytwt.tobycm.systems/tobycm`);

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
    browser.tabs.sendMessage(tabs[0].id, { event: "just", just });
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "just") {
    just = message.just;
    log("just", just);
  }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "navigate") {
    const videoId = message.videoId;

    log("Navigating to video", videoId);
    sendEvent(
      JSON.stringify({ event: "load", data: videoId, key: message.key })
    );
  }
});

function sendToTab(message) {
  browser.tabs.query({ active: true }, function (tabs) {
    browser.tabs.sendMessage(tabs[0].id, message);
  });
}

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
      sendToTab({
        event: "changeVideo",
        videoId: data,
      });
      break;
    case "play":
      just.play = true;
      sendJust();
      sendToTab({ event: "play", data });
      break;
    case "pause":
      just.pause = true;
      sendJust();
      sendToTab({ event: "pause" });
      break;
    case "seek":
      just.seek = true;
      sendJust();
      sendToTab({ event: "seek", data });
      break;
  }
});

log("Loaded background script");