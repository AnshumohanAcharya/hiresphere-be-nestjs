import { RegisterDto } from '@app/contracts';
import { OnboardingDto } from '@app/contracts/users/onboarding.dto';
import { DatabaseService } from '@app/database';
import { Injectable } from '@nestjs/common';
import { OnboardingStatus, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: RegisterDto, hashedPassword: string): Promise<Omit<User, 'password'>> {
    const user = await this.db.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    // Use _ to signal ignored variable
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        ...dto,
        onboardingStep: 'COMPLETED' as OnboardingStatus,
      },
      select: {
        id: true,
        email: true,
        onboardingStep: true,
      },
    });
  }
}
