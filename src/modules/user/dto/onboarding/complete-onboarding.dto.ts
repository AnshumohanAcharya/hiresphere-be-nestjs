import { ValidateNested, IsNotEmpty } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { OnboardingStep1Input } from './onboarding-step1.dto';
import { OnboardingStep2Input } from './onboarding-step2.dto';
import { OnboardingStep3Input } from './onboarding-step3.dto';
import { OnboardingStep4Input } from './onboarding-step4.dto';
import { OnboardingStep5Input } from './onboarding-step5.dto';

@InputType()
export class CompleteOnboardingInput {
  @Field(() => OnboardingStep1Input)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OnboardingStep1Input)
  step1: OnboardingStep1Input;

  @Field(() => OnboardingStep2Input)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OnboardingStep2Input)
  step2: OnboardingStep2Input;

  @Field(() => OnboardingStep3Input)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OnboardingStep3Input)
  step3: OnboardingStep3Input;

  @Field(() => OnboardingStep4Input)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OnboardingStep4Input)
  step4: OnboardingStep4Input;

  @Field(() => OnboardingStep5Input, { nullable: true })
  @ValidateNested()
  @Type(() => OnboardingStep5Input)
  step5?: OnboardingStep5Input;
}
