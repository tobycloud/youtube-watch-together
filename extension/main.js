const ws = new WebSocket(`wss://ytwt.tobycm.systems/tobycm`);
ws.addEventListener("message", (event) => {
  console.debug("Received message", event.data);
  const { event: eventName, data } = JSON.parse(event.data);

  switch (eventName) {
    case "load":
      changeVideo(data);
      break;
    case "play":
      play();
      break;
    case "pause":
      pause();
      break;
    case "seek":
      seekTo(data);
      break;
  }
});

const player = document.getElementsByClassName(
  "video-stream html5-main-video"
)[0];

function sendEvent(event, data) {
  ws.send(JSON.stringify({ event, data }));
}

player.addEventListener("loadstart", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const vId = urlParams.get("v");

  sendEvent("load", vId);
});

let lastPosition = 0;

player.addEventListener("play", () => {
  sendEvent("play");
});

player.addEventListener("pause", () => {
  lastPosition = player.currentTime;
  sendEvent("pause");
});

player.addEventListener("timeupdate", () => {
  if (lastPosition !== player.currentTime) {
    sendEvent("seek", player.currentTime);
    lastPosition = player.currentTime;
  }
});

function changeVideo(videoId) {
  player.src = `https://www.youtube.com/watch?v=${videoId}`;
}

function seekTo(seconds) {
  player.currentTime = seconds;
}

function play() {
  player.play();
}

function pause() {
  player.pause();
}
