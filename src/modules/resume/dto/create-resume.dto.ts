import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateResumeDto {
  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  filePath?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  isDefault: boolean;
}
