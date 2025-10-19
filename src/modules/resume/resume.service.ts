import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumeService {
  constructor(private prisma: PrismaService) {}

  async createResume(userId: string, createResumeDto: CreateResumeDto) {
    // If this is set as default, unset other resumes as default
    if (createResumeDto.isDefault) {
      await this.prisma.resume.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.resume.create({
      data: {
        userId,
        ...createResumeDto,
      },
    });
  }

  async getUserResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResumeById(id: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async updateResume(id: string, userId: string, updateResumeDto: UpdateResumeDto) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // If this is set as default, unset other resumes as default
    if (updateResumeDto.isDefault) {
      await this.prisma.resume.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.resume.update({
      where: { id },
      data: updateResumeDto,
    });
  }

  async deleteResume(id: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return this.prisma.resume.delete({
      where: { id },
    });
  }

  async setDefaultResume(id: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // Unset all other resumes as default
    await this.prisma.resume.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this resume as default
    return this.prisma.resume.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async getDefaultResume(userId: string) {
    return this.prisma.resume.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }
}
