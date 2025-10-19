import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiInterviewService } from './ai-interview.service';
import { StartAiInterviewDto } from './dto/start-ai-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiInterviewSession } from './dto/ai-interview-session.dto';

@Resolver()
export class AiInterviewResolver {
  constructor(private readonly aiInterviewService: AiInterviewService) {}

  @Mutation(() => AiInterviewSession)
  @UseGuards(JwtAuthGuard)
  async startAiInterview(
    @Context() context,
    @Args('input') startInterviewDto: StartAiInterviewDto,
  ) {
    return this.aiInterviewService.startInterview(context.req.user.id, startInterviewDto);
  }

  @Mutation(() => AiInterviewSession)
  @UseGuards(JwtAuthGuard)
  async submitAnswer(
    @Context() context,
    @Args('sessionId') sessionId: string,
    @Args('input') submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.aiInterviewService.submitAnswer(sessionId, context.req.user.id, submitAnswerDto);
  }

  @Query(() => AiInterviewSession)
  @UseGuards(JwtAuthGuard)
  async getInterviewSession(@Context() context, @Args('sessionId') sessionId: string) {
    return this.aiInterviewService.getInterviewSession(sessionId, context.req.user.id);
  }

  @Query(() => [AiInterviewSession])
  @UseGuards(JwtAuthGuard)
  async myInterviewSessions(@Context() context) {
    return this.aiInterviewService.getUserInterviewSessions(context.req.user.id);
  }
}
