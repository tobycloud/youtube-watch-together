import express from "express";
import { OPEN, Server, WebSocket } from "ws";

const app = express();
const server = app.listen(12372);

const wss = new Server({ server });

function randomString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const hosts = new Map<string, string>(); // roomId -> key

wss.on("connection", (ws: { data: { roomId: string } } & WebSocket) => {
  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(String(message));

    if (!["load", "play", "pause", "seek"].includes(parsedMessage.event)) {
      return;
    }

    if (hosts.get(ws.data.roomId) === undefined) {
      const key = randomString(32);
      hosts.set(ws.data.roomId, key);
      ws.send(
        JSON.stringify({
          event: "host",
          data: key,
        })
      );

      ws.onclose = () => {
        hosts.delete(ws.data.roomId);
      };
    } else if (hosts.get(ws.data.roomId) !== parsedMessage.key)
      return ws.send(JSON.stringify({ event: "invalid_key" }));
    parsedMessage.key = undefined;

    (wss.clients as Set<{ data: { roomId: string } } & WebSocket>).forEach(
      (client) => {
        if (client.data.roomId !== ws.data.roomId) {
          return;
        }

        if (client !== ws && client.readyState === OPEN) {
          client.send(JSON.stringify(parsedMessage));
        }
      }
    );
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
