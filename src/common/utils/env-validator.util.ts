import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidator');

// Get an environment variable with type safety and validation
export function getEnvOrThrow(key: string, description?: string): string {
  const value = process.env[key];

  if (!value) {
    const message = `Environment variable ${key} is required${description ? ` (${description})` : ''}`;
    logger.error(message);
    throw new Error(message);
  }

  return value;
}

// Get an environment variable with a default value
export function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

// Get a number environment variable
export function getEnvAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return numValue;
}

// Get a boolean environment variable
export function getEnvAsBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

// Check if environment is production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Check if environment is development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}
