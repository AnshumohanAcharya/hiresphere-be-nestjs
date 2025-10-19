import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobApplicationDto } from './dto/job-application.dto';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}

  async createJob(createJobDto: CreateJobDto, postedBy: string) {
    const job = await this.prisma.job.create({
      data: {
        ...createJobDto,
        postedBy,
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return job;
  }

  async getAllJobs(skip = 0, take = 10, search?: string) {
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
          isActive: true,
        }
      : { isActive: true };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
        orderBy: { postedAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      total,
      hasMore: skip + take < total,
    };
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        applications: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async updateJob(id: string, updateJobDto: UpdateJobDto, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedBy !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    return this.prisma.job.update({
      where: { id },
      data: updateJobDto,
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });
  }

  async deleteJob(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedBy !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    return this.prisma.job.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async applyToJob(jobId: string, userId: string, applicationDto: JobApplicationDto) {
    // Check if user already applied
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existingApplication) {
      throw new ForbiddenException('You have already applied to this job');
    }

    return this.prisma.application.create({
      data: {
        userId,
        jobId,
        coverLetter: applicationDto.coverLetter,
        resumeId: applicationDto.resumeId,
      },
    });
  }

  async getUserApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async getJobApplications(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedBy !== userId) {
      throw new ForbiddenException('You can only view applications for your own jobs');
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        user: {
          include: {
            profile: true,
            skills: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }
}
