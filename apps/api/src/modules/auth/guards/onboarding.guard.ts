import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OnboardingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (user?.onboardingStep !== 'COMPLETED') {
      throw new ForbiddenException('Please complete your onboarding first.');
    }

    return true;
  }
}
