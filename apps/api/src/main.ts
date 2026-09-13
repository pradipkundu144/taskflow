import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './config/env';
import { connectMongo, disconnectMongo, mongoStatus } from './infra/mongo';
import { connectRedis, disconnectRedis, redisStatus } from './infra/redis';
import { logger } from './lib/logger';
import { asyncHandler, errorHandler } from './middleware/error';
import { requestLog } from './middleware/request-log';
import { seedAdmin } from './modules/admin/seed';
import { authRouter } from './modules/auth/auth.route';

const env = loadEnv();

let version = 'dev';
for (const dir of [process.cwd(), __dirname]) {
  try {
    const pkg = JSON.parse(
      readFileSync(join(dir, 'package.json'), 'utf-8'),
    ) as { version?: string };
    if (pkg.version) {
      version = pkg.version;
      break;
    }
  } catch {
    continue;
  }
}

async function main(): Promise<void> {
  const app = express();

  app.use(requestLog);
  app.use(express.json());
  app.use(cookieParser());

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

  api.use('/auth', authRouter);

  app.use('/api', api);

  app.use(errorHandler);

  await connectMongo();
  await connectRedis();
  await seedAdmin();

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
