function randomString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

import express from "express";
import { Server } from "socket.io";

const app = express();
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
  socket.on("error", console.error);

  socket.on("join", (roomId) => {
    socket.data.roomId = roomId;

    if (keys.get(roomId) === undefined) {
      const key = randomString(32);
      keys.set(roomId, key);
      socket.emit("host", key);

      socket.on("disconnect", () => keys.delete(socket.data.roomId));
    }

    socket.join(roomId);
  });

  socket.on("load", (videoId, key) => {
    if (!checkKey(socket.data.roomId, key)) return;
    console.log("load", videoId);
    socket.to(socket.data.roomId).emit("load", videoId);
  });

  socket.on("play", (currentTimestamp, key) => {
    if (!checkKey(socket.data.roomId, key)) return;
    socket.to(socket.data.roomId).emit("play", currentTimestamp);
  });

  socket.on("pause", (currentTimestamp, key) => {
    if (!checkKey(socket.data.roomId, key)) return;
    socket.to(socket.data.roomId).emit("pause", currentTimestamp);
  });

  socket.on("seek", (currentTimestamp, key) => {
    if (!checkKey(socket.data.roomId, key)) return;
    socket.to(socket.data.roomId).emit("seek", currentTimestamp);
  });
});
