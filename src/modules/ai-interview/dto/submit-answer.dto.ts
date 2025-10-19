import { IsString, MinLength } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SubmitAnswerDto {
  @Field()
  @IsString()
  @MinLength(10)
  answer: string;
}
