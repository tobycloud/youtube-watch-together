if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

let lastPosition = 0;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "changeVideo") {
    changeVideo(message.videoId);
  }
});

function changeVideo(videoId) {
  const urlParams = new URLSearchParams(window.location.search);
  const currentVideoId = urlParams.get("v");
  if (currentVideoId === videoId) return;

  window.location.href = `https://www.youtube.com/watch?v=${videoId}`;
}

log("Loaded extension");

let lastUrl = window.location.href;

async function checkUrl() {
  if (window.location.href === lastUrl) return;
  if (!window.location.pathname.startsWith("/watch")) return;

  lastUrl = window.location.href;

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v");
  if (!videoId) return;

  browser.runtime.sendMessage({
    event: "navigate",
    videoId,
    key: (await browser.storage.local.get("key")).key,
  });

  const player = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];

  if (!player) return;

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.event) {
      case "play":
        player.currentTime = message.time;
        player.play();
        break;
      case "pause":
        player.pause();
        break;
      case "seek":
        player.currentTime = message.time;
        break;
    }
  });

  player.addEventListener("play", async () => {
    browser.runtime.sendMessage({
      event: "play",
      time: player.currentTime,
      key: (await browser.storage.local.get("key")).key,
    });
  });

  player.addEventListener("pause", async () => {
    lastPosition = player.currentTime;
    browser.runtime.sendMessage({
      event: "pause",
      key: (await browser.storage.local.get("key")).key,
    });
  });

  player.addEventListener("timeupdate", async () => {
    if (lastPosition !== player.currentTime && player.paused) {
      browser.runtime.sendMessage({
        event: "seek",
        time: player.currentTime,
        key: (await browser.storage.local.get("key")).key,
      });
      lastPosition = player.currentTime;
    }
  });
}

window.addEventListener("popstate", checkUrl);
setInterval(checkUrl, 250);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "changeVideo") {
    changeVideo(videoId);
  }
});
