import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from './user.dto';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => User)
  user: User;

  @Field(() => Int)
  expiresIn: number; // seconds until access token expires
}
