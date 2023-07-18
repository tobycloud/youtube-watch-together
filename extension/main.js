if (typeof browser === "undefined") {
  var browser = chrome;
}

function log(...args) {
  console.log("[YouTube Watch Together]", ...args);
}

var ws = new WebSocket(`ws:/localhost:12372/tobycm1`);

ws.addEventListener("open", () => {
  log("Connected to server");
  sendEvent("connect", { needKey: false });
});

let just = {
  play: false,
  pause: false,
  seek: false,
};

ws.addEventListener("message", async (event) => {
  let eventData = event.data;

  if (event.data instanceof Blob) {
    eventData = await event.data.text();
  }
  const { event: eventName, data } = JSON.parse(eventData);

  log("Received message", eventName, data || "");

  switch (eventName) {
    case "host":
      browser.storage.local.set({ key: "key", data });
      break;
    case "invalid_key":
      browser.storage.local.remove("key");
    case "load":
      changeVideo(data);
      break;
    case "play":
      just.play = true;
      play(data.time);
      break;
    case "pause":
      just.pause = true;
      pause();
      break;
    case "seek":
      just.seek = true;
      seekTo(data);
      break;
  }
});

let lastPosition = 0;

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
      return;
    }
    sendEvent("play", { data: { time: player.currentTime } });
  });

  player.addEventListener("pause", () => {
    if (just.pause) {
      just.pause = false;
      return;
    }
    lastPosition = player.currentTime;
    sendEvent("pause");
  });

  player.addEventListener("timeupdate", () => {
    if (lastPosition !== player.currentTime && player.paused) {
      if (just.seek) {
        just.seek = false;
        return;
      }
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

  player.play().catch((e) => {
    if (e instanceof DOMException) {
      // Autoplay was prevented.
      alert("Please allow autoplay for the best experience.");
    }
  });
  if (!playing) player.pause();
}

async function sendEvent(event, { data, needKey = true }) {
  if (ws.readyState != ws.OPEN) return;

  const message = { event };
  if (data) message.data = data;
  if (needKey) {
    message.key = await browser.storage.local.get("key");
  }

  log("Sending message", message);
  ws.send(JSON.stringify(message));
}

let lastUrl = window.location.href;

window.addEventListener("popstate", () => {
  if (window.location.href === lastUrl) return;

  const urlParams = new URLSearchParams(window.location.search);
  const vId = urlParams.get("v");
  if (!vId) return;

  sendEvent("load", { data: vId });

  lastUrl = window.location.href;
});
