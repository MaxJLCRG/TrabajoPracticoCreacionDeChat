import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const useSocket = (
  options = { withCredentials: false },
  serverUrl = "http://localhost:4000" // 👈 Backend en el puerto 4000
) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIo = io(serverUrl, options);

    socketIo.on("connect", () => {
      setIsConnected(true);
      console.log("✅ WebSocket conectado al backend en", serverUrl);
    });

    socketIo.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ WebSocket desconectado");
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [serverUrl, JSON.stringify(options)]);

  return { socket, isConnected };
};

export { useSocket };
