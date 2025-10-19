import { IsString, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class JobApplicationDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  resumeId?: string;
}
