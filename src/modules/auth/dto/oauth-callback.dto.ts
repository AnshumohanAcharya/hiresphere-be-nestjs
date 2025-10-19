import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class OAuthCallbackInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;

  @Field({ nullable: true })
  state?: string;
}
