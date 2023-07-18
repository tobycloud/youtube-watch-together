import express from "express";
import { OPEN, WebSocket as OriginalWebSocket, Server } from "ws";

class WebSocket extends OriginalWebSocket {
  data = {
    roomId: "",
  };
}

const app = express();
app.listen(12372);

const wss = new Server<typeof WebSocket>({ noServer: true });

const rooms = new Map<string, WebSocket[]>(); // roomId -> clients
const hosts = new Map<string, string>(); // roomId -> key

function randomString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

app.get("/:roomId", (request, response) => {
  const roomId = request.params.roomId;

  if (request.headers.upgrade !== "websocket") {
    response.status(400).send("Expected websocket");
    return;
  }

  wss.handleUpgrade(request, request.socket, Buffer.alloc(0), (ws) => {
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

wss.addListener("connection", (ws) => {
  ws.on("close", () => {
    const room = rooms.get(ws.data.roomId);
    if (room === undefined) return;
    room.splice(room.indexOf(ws), 1);
    rooms.set(ws.data.roomId, room);
  });

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(String(message));

    if (
      !["connect", "load", "play", "pause", "seek"].includes(
        parsedMessage.event
      )
    )
      return;

    if (parsedMessage.event === "connect") {
      let room = rooms.get(ws.data.roomId) || [];
      room.push(ws);
      rooms.set(ws.data.roomId, room);

      if (hosts.get(ws.data.roomId) === undefined) {
        const key = randomString(32);
        hosts.set(ws.data.roomId, key);
        ws.send(
          JSON.stringify({
            event: "host",
            data: key,
          })
        );

        ws.on("close", () => hosts.delete(ws.data.roomId));
      }

      return;
    }

    if (hosts.get(ws.data.roomId) !== parsedMessage.key)
      return ws.send(JSON.stringify({ event: "invalid_key" }));
    parsedMessage.key = undefined;

    rooms.get(ws.data.roomId)!.forEach((client) => {
      if (client !== ws && client.readyState === OPEN) {
        client.send(JSON.stringify(parsedMessage));
      }
    });
  });
});
