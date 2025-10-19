import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.dto';

@ObjectType()
export class LoginResponse {
  @Field()
  access_token: string;

  @Field(() => User)
  user: User;
}
