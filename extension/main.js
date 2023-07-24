if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

browser.runtime.onMessage.addListener((message) => {
  log("Received message from service worker: ", message);
});

browser.runtime.onMessage.addListener((message) => {
  if (message.event === "notification") {
    const toast = document.createElement("div");
    toast.className = "toast";
    const heading = document.createElement("p");
    heading.textContent = "Joined Room:";
    const roomID = document.createElement("h5");
    roomID.textContent = message.roomId;
    const dismiss = document.createElement("p");
    dismiss.id = "dismiss";
    dismiss.textContent = "Click to dismiss";

    toast.appendChild(heading);
    toast.appendChild(roomID);
    toast.appendChild(dismiss);

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 100);
    toast.addEventListener("click", () => {
      toast.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    });
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.event === "changeVideo")
    window.location.href = `https://www.youtube.com/watch?v=${message.videoId}`;
});

log("Loaded extension");

let player;

function checkUrl() {
  if (!window.location.pathname.startsWith("/watch")) return;

  const videoId = new URLSearchParams(window.location.search).get("v");
  if (!videoId) return;

  browser.runtime.sendMessage({ event: "navigate", videoId });

  if (!player) {
    player = document.getElementsByClassName(
      "video-stream html5-main-video"
    )[0];
    if (!player) return;

    log("Found player");

    player.pause();

    player.addEventListener("play", () =>
      browser.runtime.sendMessage({ event: "play", time: player.currentTime })
    );

    player.addEventListener("pause", () =>
      browser.runtime.sendMessage({ event: "pause" })
    );
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (!player) return;
  if (message.time !== undefined) player.currentTime = message.time;
  if (message.event === "play") player.play();
  if (message.event === "pause") player.pause();
});

window.addEventListener("popstate", checkUrl);
setInterval(checkUrl, 200);
