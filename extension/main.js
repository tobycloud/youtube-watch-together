if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

let just = {
  play: false,
  pause: false,
  seek: false,
};

function sendJust() {
  browser.runtime.sendMessage({ event: "just", just });
  log("just", just);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "just") {
    just = message.just;
  }
});

let lastPosition = 0;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "changeVideo") {
    changeVideo(message.videoId);
  }
});

function changeVideo(videoId) {
  window.location.href = `https://www.youtube.com/watch?v=${videoId}`;
}

log("Loaded extension");

async function sendEvent(event, { data = undefined, needKey = true }) {
  const message = { event };
  if (data) message.data = data;
  if (needKey) {
    message.key = (await browser.storage.local.get("key")).key;
  }

  log("Sending message", message);
  browser.runtime.sendMessage({
    event: "sendEvent",
    data: JSON.stringify(message),
  });
}

async function navigateAway(videoId) {
  log("Navigating away");

  browser.runtime.sendMessage({
    event: "navigate",
    videoId,
    key: (await browser.storage.local.get("key")).key,
  });
}

let lastUrl = window.location.href;

async function checkUrl() {
  if (window.location.href === lastUrl) return;
  if (!window.location.pathname.startsWith("/watch")) return;

  lastUrl = window.location.href;

  const urlParams = new URLSearchParams(window.location.search);
  const vId = urlParams.get("v");

  log("Changing video");
  navigateAway(vId || "dQw4w9WgXcQ");

  log("Watching video");

  let player = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];

  const gettingPlayerInterval = setInterval(() => {
    if (!player) {
      player = document.getElementsByClassName(
        "video-stream html5-main-video"
      )[0];
      return;
    }
    clearInterval(gettingPlayerInterval);
  }, 250);

  while (!player) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.event) {
      case "play":
        player.currentTime = message.data;
        player.play();
        break;
      case "pause":
        player.pause();
        break;
      case "seek":
        player.currentTime = message.data;
        break;
    }
  });

  player.addEventListener("play", () => {
    if (just.play) {
      just.play = false;
      sendJust();
      return;
    }

    log("Playing video");
    sendEvent("play", { data: { time: player.currentTime } });
  });

  player.addEventListener("pause", () => {
    if (just.pause) {
      just.pause = false;
      sendJust();
      return;
    }
    lastPosition = player.currentTime;
    log("Pausing video");
    sendEvent("pause", {});
  });

  player.addEventListener("timeupdate", () => {
    if (lastPosition !== player.currentTime && player.paused) {
      if (just.seek) {
        just.seek = false;
        sendJust();
        return;
      }
      log("Seeking video");
      sendEvent("seek", { data: player.currentTime });
      lastPosition = player.currentTime;
    }
  });
}

window.addEventListener("popstate", checkUrl);

setInterval(checkUrl, 100);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "changeVideo") {
    const videoId = message.videoId;
    if (videoId !== vId) changeVideo(videoId);
  }
});
