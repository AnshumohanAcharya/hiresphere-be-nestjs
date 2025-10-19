import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OnboardingStep4Input {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fileBase64?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fileName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  filePath?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isDefault: boolean;
}
