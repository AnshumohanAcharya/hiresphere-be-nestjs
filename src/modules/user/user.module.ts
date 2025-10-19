import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { OnboardingService } from './onboarding.service';
import { OnboardingResolver } from './onboarding.resolver';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [UserService, UserResolver, OnboardingService, OnboardingResolver],
  exports: [UserService, OnboardingService],
})
export class UserModule {}
