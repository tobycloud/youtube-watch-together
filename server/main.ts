import express from "express";
import { Server } from "socket.io";

const app = express();

app.route("/").get((_, res) => res.json({ status: "ok" }));

const wss = new Server(
  app.listen(12372, () => console.log("Started server")),
  {
    pingInterval: 5000,
    pingTimeout: 10000,
    cors: {
      origin: "*",
    },
  }
);

const keys = new Map<string, string>(); // roomId -> key
const checkKey = (roomId: string, key: string) => keys.get(roomId) === key;

wss.on("connection", (socket) => {
  const key = socket.handshake.auth.key;
  const roomId = socket.handshake.query.roomId;

  if (key === undefined || roomId === undefined || Array.isArray(key) || Array.isArray(roomId)) return socket.disconnect();

  if (keys.get(roomId) === undefined) {
    keys.set(roomId, key);
    socket.emit("host");
  }

  socket.join(roomId);

  socket.on("error", console.error);

  socket.on("load", (...data) => {
    if (checkKey(roomId, key)) socket.to(roomId).emit("load", ...data);
  });

  socket.on("play", (...data) => {
    if (checkKey(roomId, key)) socket.to(roomId).emit("play", ...data);
  });

  socket.on("pause", (...data) => {
    if (checkKey(roomId, key)) socket.to(roomId).emit("pause", ...data);
  });

  socket.on("seek", (...data) => {
    if (checkKey(roomId, key)) socket.to(roomId).emit("seek", ...data);
  });

  socket.on("disconnect", () => {
    if (checkKey(roomId, key)) keys.delete(roomId);
  });
});
