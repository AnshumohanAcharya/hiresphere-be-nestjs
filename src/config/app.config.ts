import { registerAs } from '@nestjs/config';

import { getEnvAsNumber, getEnvOrDefault, getEnvOrThrow } from '@common/utils/env-validator.util';

export const appConfig = registerAs('app', () => ({
  port: getEnvAsNumber('PORT', 4000),
  env: getEnvOrDefault('NODE_ENV', 'development'),
  jwtSecret: getEnvOrThrow('JWT_SECRET', 'JWT signing secret'),
}));
