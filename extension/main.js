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

if (window.location.pathname.startsWith("/watch")) {
  const player = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];

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
    sendEvent("pause");
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

  function seekTo(seconds) {
    player.currentTime = seconds;
  }

  function play(time) {
    player.currentTime = time;
    player.play();
  }

  function pause() {
    player.pause();
  }

  const playing = !player.paused;

  player.play().catch((error) => {
    if (error instanceof DOMException) {
      // Autoplay was prevented.
      console.error(error);
      alert("Please allow autoplay for the best experience.");
    }
  });
  if (!playing) player.pause();
}

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

let lastUrl = window.location.href;

setInterval(() => {
  if (window.location.href === lastUrl) return;

  const urlParams = new URLSearchParams(window.location.search);
  const vId = urlParams.get("v");
  if (!vId) return;

  log("Changing video");
  sendEvent("load", { data: vId });

  lastUrl = window.location.href;
}, 100);
