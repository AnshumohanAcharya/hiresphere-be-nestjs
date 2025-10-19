import { IsInt, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';
import { WorkPreference } from '../../../../../generated/prisma';

@InputType()
export class OnboardingStep2Input {
  @Field(() => Int)
  @IsInt()
  @Min(0)
  experience: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(WorkPreference)
  workPreference?: WorkPreference;
}
