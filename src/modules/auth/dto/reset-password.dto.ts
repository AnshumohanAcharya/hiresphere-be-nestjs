import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
