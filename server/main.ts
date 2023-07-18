import express from "express";
import { OPEN, Server } from "ws";

const app = express();
const server = app.listen(12372);

const wss = new Server({ server });

wss.on("connection", (ws) => {
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === OPEN) {
      client.send(JSON.stringify({
        event: "connect", data: null
      }));
    }
  });
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

app.use((request, response) => {
  const roomId = request.url.split("/")[1];

  if (!roomId) {
    response.status(400).send("No room id");
    return;
  }

  if (request.headers.upgrade !== "websocket") {
    response.status(400).send("Expected websocket");
    return;
  }

  wss.handleUpgrade(request, request.socket, Buffer.alloc(0), (ws) => {
    // @ts-ignore
    ws.data = { roomId };
    wss.emit("connection", ws);
  });

  response.writeHead(101, {
    "Content-Type": "text/plain",
    Connection: "Upgrade",
    Upgrade: "websocket",
  });
  response.end();
});
