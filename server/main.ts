function randomString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

import express from "express";
import { Server, Socket } from "socket.io";

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

const lingeringSockets = new Map<string, NodeJS.Timeout>(); // roomId -> timeout

const keys = new Map<string, string>(); // roomId -> key
const checkKey = (socket: Socket) =>
  keys.get(socket.data.roomId) === socket.handshake.auth.key;

wss.on("connection", (socket) => {
  socket.on("error", console.error);

  socket.on("disconnect", () =>
    lingeringSockets.set(
      socket.handshake.auth.key,
      setTimeout(() => {
        lingeringSockets.delete(socket.data.roomId);
        if (keys.get(socket.data.roomId) === socket.handshake.auth.key)
          keys.delete(socket.data.roomId);
      }, 10000)
    )
  );

  socket.on("join", (roomId) => {
    const key = socket.handshake.auth.key;
    socket.data.roomId = roomId;

    if (lingeringSockets.get(key) !== undefined) {
      clearTimeout(lingeringSockets.get(key)!);
      lingeringSockets.delete(key);
      return socket.emit("reconnect");
    }

    if (keys.get(roomId) === undefined) {
      keys.set(roomId, key);
      socket.emit("host");

      socket.on("disconnect", () => {});
    }

    socket.join(roomId);
  });

  socket.on("load", (videoId, startAt) => {
    if (!checkKey(socket)) return;
    socket.to(socket.data.roomId).emit("load", videoId, startAt);
  });

  socket.on("play", (currentTimestamp) => {
    if (!checkKey(socket)) return;
    socket.to(socket.data.roomId).emit("play", currentTimestamp);
  });

  socket.on("pause", () => {
    if (!checkKey(socket)) return;
    socket.to(socket.data.roomId).emit("pause");
  });
});
