import { registerAs } from '@nestjs/config';

import { getEnvOrThrow } from '@common/utils/env-validator.util';

export const databaseConfig = registerAs('database', () => ({
  url: getEnvOrThrow('DATABASE_URL', 'PostgreSQL connection string'),
}));
