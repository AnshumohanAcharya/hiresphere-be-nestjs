import { registerAs } from '@nestjs/config';

export const graphqlConfig = registerAs('graphql', () => ({
  playground: process.env.NODE_ENV !== 'production',
  introspection: true,
}));
