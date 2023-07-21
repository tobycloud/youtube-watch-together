function joinRoom() {
  var roomId = document.getElementById("roomId").value;
  chrome.runtime.sendMessage({
    event: "joinRoom",
    roomId,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#joinRoomButton").addEventListener("click", joinRoom);
});
