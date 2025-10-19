import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MessageResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}
