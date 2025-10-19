import { IsString, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StartAiInterviewDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobId?: string;
}
