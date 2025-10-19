import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';
import { JobType, WorkMode } from '../../../../generated/prisma';

@InputType()
export class UpdateJobDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
