const response = await fetch("http://localhost:3001/new");
const roomId = await response.text();

const ws = new WebSocket(`ws://localhost:12372/${roomId}`);
const ws2 = new WebSocket(`ws://localhost:12372/${roomId}`);

ws2.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));

  if (message.event === "load" && message.videoId === "4Q_Zt4RhJTM") {
    return console.log("Success!");
  }

  console.log("Failure!");
});

ws.addEventListener("open", (event) => {
  ws.send(JSON.stringify({ event: "load", videoId: "4Q_Zt4RhJTM" }));
});

ws.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));

  if (message.event === "new") {
    console.log(ws);
  }
});
