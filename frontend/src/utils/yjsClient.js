// client/src/utils/yjsClient.js
import * as Y from "yjs";

export function createYDocConnection(roomName = "default") {
  const ydoc = new Y.Doc();

  // Connect to your backend WebSocket
  const ws = new WebSocket(`ws://localhost:5001/yjs?room=${roomName}`); // ✅ match backend port

  ws.binaryType = "arraybuffer"; // ✅ ensure we receive raw binary data

  // When the server sends updates, apply them locally
  ws.addEventListener("message", (event) => {
    try {
      const data = new Uint8Array(event.data);
      Y.applyUpdate(ydoc, data);
      console.log("📨 Yjs update applied");
    } catch (err) {
      console.error("❌ Failed to apply Yjs update:", err);
    }
  });

  // When the local doc changes, send update to server
  ydoc.on("update", (update) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(update);
      console.log("📤 Yjs update sent");
    }
  });

  ws.addEventListener("open", () => {
    console.log(`🟢 Connected to Yjs room: ${roomName}`);
  });

  ws.addEventListener("close", () => {
    console.log(`🔴 Disconnected from Yjs room: ${roomName}`);
  });

  ws.addEventListener("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });

  return ydoc;
}
