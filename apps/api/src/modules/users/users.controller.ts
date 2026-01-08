import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingDto } from '@app/contracts/users/onboarding.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('onboarding')
  async onboarding(@GetUser('id') userId: string, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(userId, dto);
  }
}
