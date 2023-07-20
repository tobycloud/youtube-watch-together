function joinRoom() {
  var roomId = document.getElementById("roomId").value;
  chrome.runtime.sendMessage({
    type: "joinRoom",
    roomId,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#joinRoomButton").addEventListener("click", joinRoom);
});
