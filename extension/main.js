const ws = new WebSocket(`wss://ytwt.tobycm.systems/tobycm`);

ws.addEventListener("open", () => {
  console.debug("Connected to server");
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
  console.debug("Received message", String(eventData));
  const { event: eventName, data } = JSON.parse(eventData);

  console.debug("Received message", eventName, data);

  switch (eventName) {
    case "load":
      changeVideo(data);
      break;
    case "play":
      just.play = true;
      play();
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

if (window.location.pathname.startsWith("/watch")) {
  const player = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];

  player.addEventListener("play", () => {
    if (just.play) {
      just.play = false;
      return;
    }
    sendEvent("play");
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
    if (just.seek) {
      just.seek = false;
      return;
    }

    if (lastPosition !== player.currentTime && player.paused) {
      sendEvent("seek", player.currentTime);
      lastPosition = player.currentTime;
    }
  });

  function seekTo(seconds) {
    player.currentTime = seconds;
  }

  function play() {
    player.play();
  }

  function pause() {
    player.pause();
  }

  player.play().catch((e) => {
    if (e instanceof DOMException) {
      // Autoplay was prevented.
      alert("Please allow autoplay for the best experience.");
    }
  });
}

function sendEvent(event, data) {
  ws.send(JSON.stringify({ event, data }));
}

let lastUrl = window.location.href;

setInterval(() => {
  if (window.location.href === lastUrl) return;

  const urlParams = new URLSearchParams(window.location.search);
  const vId = urlParams.get("v");
  if (!vId) return;

  sendEvent("load", vId);

  lastUrl = window.location.href;
}, 100);
