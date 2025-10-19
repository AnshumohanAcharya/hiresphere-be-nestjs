import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../../../generated/prisma';

// Register the Prisma enum with GraphQL
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role enum',
});

export { UserRole };
