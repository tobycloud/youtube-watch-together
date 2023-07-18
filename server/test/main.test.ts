import WebSocket from "ws";

const roomId = "test";

const ws = new WebSocket(`ws://localhost:12372/${roomId}`);
const ws2 = new WebSocket(`ws://localhost:12372/${roomId}`);

ws2.on("message", (data) => {
  const message = JSON.parse(String(data));

  if (message.event === "load" && message.videoId === "4Q_Zt4RhJTM") {
    console.log("Success!");
    ws.close();
    ws2.close();
  } else {
    console.log("Failure!");
  }
});

ws.on("open", () => {
  ws.send(JSON.stringify({ event: "load", videoId: "4Q_Zt4RhJTM" }));
});

ws.on("message", (data) => {
  const message = JSON.parse(String(data));

  if (message.event === "new") {
    console.log(ws);
  }
});
