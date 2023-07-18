import express from "express";
import { OPEN, Server } from "ws";

const app = express();
const server = app.listen(12372);

const wss = new Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(String(message));

    if (!["load", "play", "pause", "seek"].includes(parsedMessage.event)) {
      return;
    }

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === OPEN) {
        client.send(message);
      }
    });
  });
});

app.use((req, res) => {
  const url = new URL(req.url);

  const roomId = url.pathname.split("/")[1];

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    ws.data = { roomId };
    wss.emit("connection", ws);
  });

  res.writeHead(101, {
    "Content-Type": "text/plain",
    Connection: "Upgrade",
    Upgrade: "websocket",
  });
  res.end();
});
