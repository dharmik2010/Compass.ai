import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  joinTripRoom: (tripId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connects to socket backend (proxied automatically via Vite)
    const newSocket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.io server: ', newSocket.id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinTripRoom = (tripId: string) => {
    if (socket) {
      socket.emit('join-trip', tripId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinTripRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
