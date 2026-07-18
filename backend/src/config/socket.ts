import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-trip', (tripId: string) => {
      socket.join(tripId);
      console.log(`👤 Client ${socket.id} joined trip room: ${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const notifyTripUpdate = (tripId: string, event: string, data: any) => {
  if (io) {
    io.to(tripId.toString()).emit(event, data);
    console.log(`📡 Broadcasted event "${event}" to trip room: ${tripId}`);
  }
};
