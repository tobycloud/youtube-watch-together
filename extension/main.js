function sendEvent(event, data) {
  console.debug(event, data); // send to server demo
}

const player = document.getElementsByClassName(
  "video-stream html5-main-video"
)[0];

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
  sendEvent("pause");
});

player.addEventListener("timeupdate", () => {
  if (!player.paused) lastPosition = player.currentTime;
  else if (lastPosition !== player.currentTime) {
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
