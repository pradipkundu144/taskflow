import 'dotenv/config';
import express from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './config/env';
import { logger } from './lib/logger';
import { connectMongo, disconnectMongo, mongoStatus } from './lib/mongo';
import { connectRedis, disconnectRedis, redisStatus } from './lib/redis';
import { asyncHandler, errorHandler } from './middleware/error';
import { requestLog } from './middleware/request-log';

const env = loadEnv();

let version = 'dev';
try {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, 'package.json'), 'utf-8'),
  ) as { version?: string };
  version = pkg.version ?? 'dev';
} catch {
  version = 'dev';
}

async function main(): Promise<void> {
  const app = express();

  app.use(requestLog);
  app.use(express.json());

  const api = express.Router();

  api.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.get(
    '/readyz',
    asyncHandler(async (_req, res) => {
      const mongo = mongoStatus();
      const redis = await redisStatus();
      const ready = mongo === 'connected' && redis === 'ready';
      res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'unready',
        mongo,
        redis,
      });
    }),
  );

  api.get('/version', (_req, res) => {
    res.json({ version });
  });

  app.use('/api', api);

  app.use(errorHandler);

  await connectMongo();
  await connectRedis();

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT }, 'api listening');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    server.close();
    await disconnectMongo();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'startup failed');
  process.exit(1);
});
