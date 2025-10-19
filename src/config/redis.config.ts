import { getEnvAsNumber, getEnvOrDefault } from '@/common/utils/env-validator.util';
import { registerAs } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const redisConfig = registerAs('redis', () => {
  // Support both Upstash URL and traditional host/port
  const redisUrl = process.env.REDIS_URL;
  const host = getEnvOrDefault('REDIS_HOST', 'localhost');
  const port = getEnvAsNumber(process.env.REDIS_PORT ?? '6379', 10);

  return {
    ttl: 600,
    asProvider: () => ({
      isGlobal: true,
      store: redisStore,
      ...(redisUrl ? { url: redisUrl } : { host, port }),
    }),
  };
});
