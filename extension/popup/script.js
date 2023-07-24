function joinRoom() {
  let roomId = document.getElementById("roomId").value;
  chrome.tabs.query(
    { active: true, currentWindow: true, url: "https://www.youtube.com/*" },
    (tabs) => {
      const youtubeTab = tabs[0].id;
      if (youtubeTab) {
        chrome.tabs.sendMessage(youtubeTab, { event: "notification", roomId });
        chrome.runtime.sendMessage({
          event: "joinRoom",
          roomId,
        });
      }
    }
  );
  window.close();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#joinRoomButton").addEventListener("click", joinRoom);
});

document.onkeydown = function (e) {
  if (e.key === "Enter") joinRoom();
};
