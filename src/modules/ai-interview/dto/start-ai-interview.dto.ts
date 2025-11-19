import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StartAiInterviewDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
}
