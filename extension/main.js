if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

browser.runtime.onMessage.addListener((message) => {
  log("Received message from service worker:", message);
});

browser.runtime.onMessage.addListener((message) => {
  if (message.event === "changeVideo")
    window.location.href = `https://www.youtube.com/watch?v=${message.videoId}`;
});

(async () => {
  const key = (await browser.storage.local.get("key")).key;
  browser.runtime.sendMessage({
    event: "initKey",
    key,
  });
})();

log("Loaded extension");

function checkUrl() {
  if (!window.location.pathname.startsWith("/watch")) return;

  const videoId = new URLSearchParams(window.location.search).get("v");
  if (!videoId) return;

  browser.runtime.sendMessage({ event: "navigate", videoId });

  const player = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];

  if (!player) return;

  browser.runtime.onMessage.addListener((message) => {
    if (message.time) player.currentTime = message.time;
    if (message.event === "play") player.play();
    if (message.event === "pause") player.pause();
  });

  player.addEventListener("play", () =>
    browser.runtime.sendMessage({ event: "play", time: player.currentTime })
  );

  player.addEventListener("pause", () =>
    browser.runtime.sendMessage({ event: "pause" })
  );
}

window.addEventListener("popstate", checkUrl);
setInterval(checkUrl, 200);
