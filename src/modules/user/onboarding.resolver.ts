import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';
import { OnboardingStep1Input } from './dto/onboarding/onboarding-step1.dto';
import { OnboardingStep2Input } from './dto/onboarding/onboarding-step2.dto';
import { OnboardingStep3Input } from './dto/onboarding/onboarding-step3.dto';
import { OnboardingStep4Input } from './dto/onboarding/onboarding-step4.dto';
import { OnboardingStep5Input } from './dto/onboarding/onboarding-step5.dto';
import { CompleteOnboardingInput } from './dto/onboarding/complete-onboarding.dto';
import { OnboardingProgress } from './dto/onboarding/onboarding-progress.dto';
import { ProfileCompleteness } from './dto/onboarding/profile-completeness.dto';
import { User } from '../auth/dto/user.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class OnboardingResolver {
  constructor(private onboardingService: OnboardingService) {}

  @Mutation(() => OnboardingProgress)
  async onboardingStep1(
    @CurrentUser() user: any,
    @Args('input') input: OnboardingStep1Input,
  ): Promise<OnboardingProgress> {
    return this.onboardingService.onboardingStep1(user.id, input);
  }

  @Mutation(() => OnboardingProgress)
  async onboardingStep2(
    @CurrentUser() user: any,
    @Args('input') input: OnboardingStep2Input,
  ): Promise<OnboardingProgress> {
    return this.onboardingService.onboardingStep2(user.id, input);
  }

  @Mutation(() => OnboardingProgress)
  async onboardingStep3(
    @CurrentUser() user: any,
    @Args('input') input: OnboardingStep3Input,
  ): Promise<OnboardingProgress> {
    return this.onboardingService.onboardingStep3(user.id, input);
  }

  @Mutation(() => OnboardingProgress)
  async onboardingStep4(
    @CurrentUser() user: any,
    @Args('input') input: OnboardingStep4Input,
  ): Promise<OnboardingProgress> {
    return this.onboardingService.onboardingStep4(user.id, input);
  }

  @Mutation(() => OnboardingProgress)
  async onboardingStep5(
    @CurrentUser() user: any,
    @Args('input') input: OnboardingStep5Input,
  ): Promise<OnboardingProgress> {
    return this.onboardingService.onboardingStep5(user.id, input);
  }

  @Mutation(() => OnboardingProgress)
  async skipOnboardingStep5(@CurrentUser() user: any): Promise<OnboardingProgress> {
    return this.onboardingService.skipOnboardingStep5(user.id);
  }

  @Mutation(() => User)
  async completeOnboarding(
    @CurrentUser() user: any,
    @Args('input') input: CompleteOnboardingInput,
  ): Promise<User> {
    return this.onboardingService.completeOnboarding(user.id, input);
  }

  @Query(() => OnboardingProgress)
  async getOnboardingProgress(@CurrentUser() user: any): Promise<OnboardingProgress> {
    return this.onboardingService.getOnboardingProgress(user.id);
  }

  @Query(() => ProfileCompleteness)
  async getProfileCompleteness(@CurrentUser() user: any): Promise<ProfileCompleteness> {
    return this.onboardingService.getProfileCompleteness(user.id);
  }
}
