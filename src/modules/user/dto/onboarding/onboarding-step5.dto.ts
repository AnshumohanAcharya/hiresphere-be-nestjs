import { IsString, IsOptional, IsInt, IsArray, Min } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class OnboardingStep5Input {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredJobTypes?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryExpectation?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  availability?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  github?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;
}
