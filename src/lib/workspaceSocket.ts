"use client"
import { io, Socket } from "socket.io-client";
import { BASE_URL_SOCKET } from "@/lib/constants";
let socket: Socket | null = null;


export const connectWorkspaceSocket = (): Socket => {
  
  const token = localStorage.getItem('token');
  
  if (!socket) {
    socket = io(`${BASE_URL_SOCKET}/workspace`, { auth: { token } });
    // socket = io("http://localhost:5000", { auth: { token } });
     

    socket.on("connect", () => {
      console.log("Connected to WebSocket server:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Disconnected from WebSocket server. Reason:", reason);
    });

    // Explicit connection
    socket.connect();
  }

  return socket;
};

export const getWorkspaceSocket = (): Socket => {
  if (!socket) {
    console.warn("Socket not initialized. Connecting now...");
    return connectWorkspaceSocket();
  }
  return socket;
};

export const disconnectWorkspaceSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected.");
  }
};
