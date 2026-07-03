/**
 * backend/socket.js
 * 
 * Socket.IO configuration and helper functions for real-time notifications.
 */

const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // userId -> Set of socketIds

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow same localhost logic as server.js
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS: origin not allowed'));
        }
      },
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // Join room based on role or userId
    socket.on('authenticate', ({ userId, role }) => {
      if (!userId) return;
      
      socket.userId = userId;
      socket.role = role;

      // Join individual room
      socket.join(userId);
      
      // Join role-based rooms
      if (role === 'user') {
        socket.join('role:user');
      } else if (role === 'theatre_owner') {
        socket.join('role:theatre_owner');
      } else if (role === 'admin') {
        socket.join('role:admin');
      }

      // Track socket for specific user
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      console.log(`👤 User authenticated: ${userId} (${role})`);
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper functions for emitting events
const notifyUser = (userId, notification) => {
  if (io) {
    io.to(userId).emit('notification', notification);
  }
};

const notifyRole = (role, notification) => {
  if (io) {
    io.to(`role:${role}`).emit('notification', notification);
  }
};

const notifyAll = (notification) => {
  if (io) {
    io.emit('notification', notification);
  }
};

module.exports = {
  initSocket,
  getIO,
  notifyUser,
  notifyRole,
  notifyAll
};
