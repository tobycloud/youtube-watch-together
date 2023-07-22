function joinRoom() {
  let roomId = document.getElementById("roomId").value;
  chrome.runtime.sendMessage({
    event: "joinRoom",
    roomId,
  });

  window.close();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#joinRoomButton").addEventListener("click", joinRoom);
});
