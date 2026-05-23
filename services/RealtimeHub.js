const { Server } = require('socket.io');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

// ─── 1. INITIALIZE REDIS CLIENT INSTANCES ────────────────────────────────────
const redisOptions = {
  maxRetriesPerRequest: null // 🚀 FIX: Allows ioredis to keep trying to reconnect instead of crashing the app
};

const pubClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', redisOptions);
const subClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', redisOptions);

// ─── 2. 🚀 CRITICAL FIX: ATTACH MISSING ERROR HANDLERS ───────────────────────
pubClient.on('error', (err) => {
  console.error('❌ Redis PubClient Error:', err.message);
});

subClient.on('error', (err) => {
  console.error('❌ Redis SubClient Error:', err.message);
});

class RealtimeHub {
  static bootstrap(httpServer) {
    const io = new Server(httpServer, {
      cors: {
        origin: (process.env.ALLOWED_ORIGINS || '').split(','),
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket']
    });

    // Handle high-speed distributed scaling node communication links
    io.adapter(require('@socket.io/redis-adapter').createAdapter(pubClient, subClient));

    // Gateway Guard: Validate incoming connection packet tokens
    io.use((socket, next) => {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

      if (!token) return next(new Error('Authentication failed: Connection token empty.'));

      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.data = { userId: decoded.id, role: decoded.role };
        next();
      } catch (err) {
        next(new Error('Authentication failed: Invalid signature block.'));
      }
    });

    io.on('connection', (socket) => {
      const { userId, role } = socket.data;
      console.log(`📡 User connected to realtime pipeline node: ${userId} (${role})`);

      socket.join(`user:${userId}`);
      if (role === 'WORKER') socket.join('pool:active_workers');

      socket.on('room:join', (payload) => {
        socket.join(`chat:${payload.roomId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected from network node: ${userId}`);
        socket.leave(`user:${userId}`);
        if (role === 'WORKER') socket.leave('pool:active_workers');
      });
    });

    return io;
  }
}

module.exports = RealtimeHub;