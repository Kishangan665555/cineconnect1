import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

// Ensure your backend URL is correct here. You can also derive this from apiService or env.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if we have a token (user is logged in)
    const token = localStorage.getItem('cc_token') || localStorage.getItem('adminToken');
    const userRaw = localStorage.getItem('cc_user');
    let user = null;
    try { if (userRaw) user = JSON.parse(userRaw); } catch {}

    if (token && user) {
      const socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      });

      socketInstance.on('connect', () => {
        console.log('🔗 [SocketContext] Connected to server:', socketInstance.id);
        setIsConnected(true);
        // Authenticate the user manually so backend places them in correct rooms
        socketInstance.emit('authenticate', { userId: user.id || user._id, role: user.role });
      });

      socketInstance.on('disconnect', () => {
        console.log('🔌 [SocketContext] Disconnected from server');
        setIsConnected(false);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, []); // Note: if you want socket to reconnect upon login/logout, you might need to track auth state changes.

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
