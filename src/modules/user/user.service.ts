import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUserProfile(userId: string, createProfileDto: CreateUserProfileDto) {
    return this.prisma.userProfile.create({
      data: {
        userId,
        ...createProfileDto,
      },
    });
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateUserProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: updateProfileDto,
      create: {
        userId,
        ...updateProfileDto,
      },
    });
  }

  async addUserSkill(userId: string, skillId: string, level: string, yearsOfExperience?: number) {
    return this.prisma.userSkill.create({
      data: {
        userId,
        skillId,
        level: level as any,
        yearsOfExperience,
      },
      include: {
        skill: true,
      },
    });
  }

  async removeUserSkill(userId: string, skillId: string) {
    return this.prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });
  }

  async getUserSkills(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true,
      },
    });
  }

  async getAllSkills() {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async completeOnboarding(userId: string) {
    // Validate minimum requirements before completing onboarding
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.firstName || !user.lastName) {
      throw new BadRequestException(
        'Please complete your basic information (first name and last name)',
      );
    }

    if (
      !user.profile ||
      user.profile.experience === null ||
      user.profile.experience === undefined
    ) {
      throw new BadRequestException('Please add your professional experience');
    }

    const skillsCount = await this.prisma.userSkill.count({
      where: { userId },
    });

    if (skillsCount < 3) {
      throw new BadRequestException('Please add at least 3 skills to your profile');
    }

    const resumeCount = await this.prisma.resume.count({
      where: { userId },
    });

    if (resumeCount === 0) {
      throw new BadRequestException('Please upload at least one resume');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isOnboardingCompleted: true },
      include: {
        profile: true,
      },
    });
  }

  async checkProfileCompleteness(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const missingFields: string[] = [];

    // Required fields for full profile
    if (!user.firstName) {
      missingFields.push('firstName');
    }
    if (!user.lastName) {
      missingFields.push('lastName');
    }
    if (!user.phone) {
      missingFields.push('phone');
    }
    if (!user.avatar) {
      missingFields.push('avatar');
    }

    if (user.profile) {
      if (user.profile.experience === null || user.profile.experience === undefined) {
        missingFields.push('experience');
      }
      if (!user.profile.location) {
        missingFields.push('location');
      }
      if (!user.profile.workPreference) {
        missingFields.push('workPreference');
      }
      if (!user.profile.bio) {
        missingFields.push('bio');
      }
      if (!user.profile.linkedin) {
        missingFields.push('linkedin');
      }
      if (!user.profile.github) {
        missingFields.push('github');
      }
      if (!user.profile.education) {
        missingFields.push('education');
      }
      if (!user.profile.salaryExpectation) {
        missingFields.push('salaryExpectation');
      }
      if (!user.profile.availability) {
        missingFields.push('availability');
      }
      if (!user.profile.preferredJobTypes || user.profile.preferredJobTypes.length === 0) {
        missingFields.push('preferredJobTypes');
      }
    } else {
      missingFields.push('profile');
    }

    if (user.skills.length < 3) {
      missingFields.push('skills');
    }

    const totalFields = 15;
    const completedFields = totalFields - missingFields.length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    return {
      percentage,
      missingFields,
      isComplete: percentage === 100,
    };
  }
}
