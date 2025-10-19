import { Injectable, NotFoundException } from '@nestjs/common';
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
}
