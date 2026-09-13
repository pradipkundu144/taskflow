import type { Server as HttpServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { SOCKET_PATH } from '@taskflow/shared';
import { Server as SocketIOServer } from 'socket.io';
import { loadEnv } from '../../config/env';
import { redis } from '../../infra/redis';
import { logger } from '../../lib/logger';
import { verifyAccessToken, type AccessPayload } from '../auth/jwt';

const env = loadEnv();

let io: SocketIOServer | null = null;

export function getIo(): SocketIOServer | null {
  return io;
}

export async function attachSocketIo(server: HttpServer): Promise<void> {
  const pub = redis.duplicate();
  const sub = redis.duplicate();
  await Promise.all([pub.connect(), sub.connect()]);

  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    path: SOCKET_PATH,
  });
  io.adapter(createAdapter(pub, sub));

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.query?.token as string | undefined);
      if (!token) return next(new Error('missing token'));
      const payload = verifyAccessToken(token);
      (socket.data as { user?: AccessPayload }).user = payload;
      next();
    } catch {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket.data as { user?: AccessPayload }).user;
    if (!user) {
      socket.disconnect();
      return;
    }
    socket.join(`user:${user.sub}`);
    if (user.role === 'admin') socket.join('role:admin');
    logger.info(
      { userId: user.sub, role: user.role, socketId: socket.id },
      'socket connected',
    );
    socket.on('disconnect', (reason) => {
      logger.info(
        { userId: user.sub, socketId: socket.id, reason },
        'socket disconnected',
      );
    });
  });

  logger.info('socket.io attached');
}

export async function shutdownSocketIo(): Promise<void> {
  if (!io) return;
  await new Promise<void>((resolve) => io?.close(() => resolve()));
  io = null;
}
