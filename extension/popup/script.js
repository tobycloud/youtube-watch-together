function joinRoom() {
  let roomId = document.getElementById("roomId").value;
  chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) =>
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { event: "notification", roomId });
    })
  );
  chrome.runtime.sendMessage({
    event: "joinRoom",
    roomId,
  });
  window.close();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#joinRoomButton").addEventListener("click", joinRoom);
});

document.onkeydown = function (e) {
  if (e.key === "Enter") joinRoom();
};
