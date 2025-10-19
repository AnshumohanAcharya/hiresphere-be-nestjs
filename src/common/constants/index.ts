export const JWT_CONSTANTS = {
  SECRET: 'your-secret-key',
  EXPIRES_IN: '7d',
};

export const CACHE_CONSTANTS = {
  TTL: 600, // 10 minutes
  MAX: 100,
};

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const FILE_CONSTANTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
};
