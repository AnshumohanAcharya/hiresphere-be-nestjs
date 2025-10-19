import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';
import { JobType, WorkMode } from '../../../../generated/prisma';

@InputType()
export class CreateJobDto {
  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  description: string;

  @Field()
  @IsString()
  company: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  salaryMax?: number;

  @Field(() => String)
  @IsEnum(JobType)
  jobType: JobType;

  @Field(() => String, { defaultValue: 'REMOTE' })
  @IsEnum(WorkMode)
  workMode: WorkMode;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  experience?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  requirements?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  benefits?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
