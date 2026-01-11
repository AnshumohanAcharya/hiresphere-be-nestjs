import { RegisterDto } from '@app/contracts';
import { OnboardingDto } from '@app/contracts/users/onboarding.dto';
import { DatabaseService } from '@app/database';
import { Injectable } from '@nestjs/common';
import { OnboardingStatus, User } from '@prisma/client';

export type SafeUser = Omit<User, 'password' | 'refreshTokenHash'>;
export type UpdateUserPayload = Partial<
  Pick<
    User,
    'firstName' | 'lastName' | 'targetRoles' | 'targetLocations' | 'minSalary' | 'preferredStack'
  >
>;

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: RegisterDto, hashedPassword: string): Promise<Omit<User, 'password'>> {
    const user = await this.db.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
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

  async findByIdWithAuth(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        onboardingStep: true,
        targetRoles: true,
        targetLocations: true,
        minSalary: true,
        preferredStack: true,
        createdAt: true,
        updatedAt: true,
      },
    });
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

  async update(id: string, data: UpdateUserPayload) {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async updateRefreshTokenHash(id: string, refreshTokenHash: string | null) {
    return this.db.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }
}
