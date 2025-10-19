import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateResumeDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  filePath?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
