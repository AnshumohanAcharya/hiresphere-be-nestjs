import { IsString, IsOptional, IsEnum, IsInt, IsArray } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';
import { WorkPreference } from '../../../../generated/prisma';

@InputType()
export class UpdateUserProfileDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  github?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  experience?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  education?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  availability?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  salaryExpectation?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredJobTypes?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(WorkPreference)
  workPreference?: WorkPreference;
}
