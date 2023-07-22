function randomString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

import { io } from "socket.io-client";

const roomId = randomString(32);
const testingVideoId = randomString(11);

const ws = io("ws://localhost:12372/");
const ws2 = io("ws://localhost:12372/");

ws.on("connect", () => {
  ws.emit("join", roomId);
});

let hostKey: string;
ws.on("host", (key) => {
  hostKey = key;
  ws.emit("load", testingVideoId, key);
});

ws2.on("connect", () => {
  ws2.emit("join", roomId);
});

ws2.on("load", (videoId) => {
  if (videoId === testingVideoId) {
    console.log("Success!");
  } else {
    console.log("Failure!");
  }
  ws.close();
  ws2.close();
});
