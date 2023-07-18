Bun.serve({
  fetch(req, server) {
    const url = new URL(req.url);

    const roomId = url.pathname.split("/")[1];

    if (!server.upgrade(req, { data: { roomId } })) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 101 });
  },
  websocket: {
    open(ws) {
      ws.subscribe((ws.data as { roomId: string }).roomId);
    },
    message(ws, msg) {
      const message = JSON.parse(String(msg));

      if (!["load", "play", "pause", "seek"].includes(message.event)) return;

      ws.publish((ws.data as { roomId: string }).roomId, msg);
    },
  },
  port: 12372,
});
