import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobApplicationDto } from './dto/job-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job } from './dto/job.dto';
import { JobConnection } from './dto/job-connection.dto';
import { Application } from './dto/application.dto';

@Resolver()
export class JobResolver {
  constructor(private readonly jobService: JobService) {}

  @Query(() => JobConnection)
  async jobs(
    @Args('skip', { defaultValue: 0 }) skip: number,
    @Args('take', { defaultValue: 10 }) take: number,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.jobService.getAllJobs(skip, take, search);
  }

  @Query(() => Job)
  async job(@Args('id') id: string) {
    return this.jobService.getJobById(id);
  }

  @Mutation(() => Job)
  @UseGuards(JwtAuthGuard)
  async createJob(@Context() context, @Args('input') createJobDto: CreateJobDto) {
    return this.jobService.createJob(createJobDto, context.req.user.id);
  }

  @Mutation(() => Job)
  @UseGuards(JwtAuthGuard)
  async updateJob(
    @Context() context,
    @Args('id') id: string,
    @Args('input') updateJobDto: UpdateJobDto,
  ) {
    return this.jobService.updateJob(id, updateJobDto, context.req.user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteJob(@Context() context, @Args('id') id: string) {
    await this.jobService.deleteJob(id, context.req.user.id);
    return true;
  }

  @Mutation(() => Application)
  @UseGuards(JwtAuthGuard)
  async applyToJob(
    @Context() context,
    @Args('jobId') jobId: string,
    @Args('input') applicationDto: JobApplicationDto,
  ) {
    return this.jobService.applyToJob(jobId, context.req.user.id, applicationDto);
  }

  @Query(() => [Application])
  @UseGuards(JwtAuthGuard)
  async myApplications(@Context() context) {
    return this.jobService.getUserApplications(context.req.user.id);
  }

  @Query(() => [Application])
  @UseGuards(JwtAuthGuard)
  async jobApplications(@Context() context, @Args('jobId') jobId: string) {
    return this.jobService.getJobApplications(jobId, context.req.user.id);
  }
}
