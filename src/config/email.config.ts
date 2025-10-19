import { registerAs } from '@nestjs/config';

import {
  getEnvAsBoolean,
  getEnvAsNumber,
  getEnvOrDefault,
  getEnvOrThrow,
} from '@common/utils/env-validator.util';

export const emailConfig = registerAs('email', () => ({
  host: getEnvOrThrow('EMAIL_HOST', 'SMTP server host'),
  port: getEnvAsNumber('EMAIL_PORT', 587),
  secure: getEnvAsBoolean('EMAIL_SECURE', false),
  auth: {
    user: getEnvOrThrow('EMAIL_USER', 'SMTP user/email address'),
    pass: getEnvOrThrow('EMAIL_PASSWORD', 'SMTP password'),
  },
  from: getEnvOrDefault('EMAIL_FROM', 'noreply@hiresphere.com'),
}));
