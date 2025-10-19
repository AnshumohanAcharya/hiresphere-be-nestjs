import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { SkillLevel } from '../../../../../generated/prisma';

@InputType()
export class SkillInput {
  @Field()
  @IsString()
  skillId: string;

  @Field(() => String)
  @IsEnum(SkillLevel)
  level: SkillLevel;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}

@InputType()
export class OnboardingStep3Input {
  @Field(() => [SkillInput])
  @IsArray()
  @ArrayMinSize(3, { message: 'Please select at least 3 skills' })
  @ValidateNested({ each: true })
  @Type(() => SkillInput)
  skills: SkillInput[];
}
