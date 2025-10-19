import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Resume } from './dto/resume.dto';

@Resolver()
export class ResumeResolver {
  constructor(private readonly resumeService: ResumeService) {}

  @Mutation(() => Resume)
  @UseGuards(JwtAuthGuard)
  async createResume(@Context() context, @Args('input') createResumeDto: CreateResumeDto) {
    return this.resumeService.createResume(context.req.user.id, createResumeDto);
  }

  @Query(() => [Resume])
  @UseGuards(JwtAuthGuard)
  async myResumes(@Context() context) {
    return this.resumeService.getUserResumes(context.req.user.id);
  }

  @Query(() => Resume)
  @UseGuards(JwtAuthGuard)
  async resume(@Context() context, @Args('id') id: string) {
    return this.resumeService.getResumeById(id, context.req.user.id);
  }

  @Mutation(() => Resume)
  @UseGuards(JwtAuthGuard)
  async updateResume(
    @Context() context,
    @Args('id') id: string,
    @Args('input') updateResumeDto: UpdateResumeDto,
  ) {
    return this.resumeService.updateResume(id, context.req.user.id, updateResumeDto);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteResume(@Context() context, @Args('id') id: string) {
    await this.resumeService.deleteResume(id, context.req.user.id);
    return true;
  }

  @Mutation(() => Resume)
  @UseGuards(JwtAuthGuard)
  async setDefaultResume(@Context() context, @Args('id') id: string) {
    return this.resumeService.setDefaultResume(id, context.req.user.id);
  }

  @Query(() => Resume, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async defaultResume(@Context() context) {
    return this.resumeService.getDefaultResume(context.req.user.id);
  }
}
