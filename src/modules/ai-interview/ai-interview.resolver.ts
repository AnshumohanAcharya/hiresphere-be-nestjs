import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiInterviewService } from './ai-interview.service';
import { ReportService } from './services/report.service';
import { TtsService } from './services/tts.service';
import { StartAiInterviewDto } from './dto/start-ai-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiInterviewSession } from './dto/ai-interview-session.dto';
import { InterviewReport } from './dto/interview-report.dto';

@Resolver()
export class AiInterviewResolver {
  constructor(
    private readonly aiInterviewService: AiInterviewService,
    private readonly reportService: ReportService,
    private readonly ttsService: TtsService,
  ) {}

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

  @Query(() => InterviewReport, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async getInterviewReport(@Context() context, @Args('sessionId') sessionId: string) {
    // Verify session belongs to user
    const session = await this.aiInterviewService.getInterviewSession(
      sessionId,
      context.req.user.id,
    );
    if (!session) {
      throw new Error('Interview session not found');
    }
    return this.reportService.getReport(sessionId);
  }

  @Mutation(() => InterviewReport)
  @UseGuards(JwtAuthGuard)
  async generateInterviewReport(@Context() context, @Args('sessionId') sessionId: string) {
    // Verify session belongs to user
    const session = await this.aiInterviewService.getInterviewSession(
      sessionId,
      context.req.user.id,
    );
    if (!session) {
      throw new Error('Interview session not found');
    }
    if (session.status !== 'COMPLETED') {
      throw new Error('Interview must be completed before generating report');
    }
    return this.reportService.generateReport(sessionId);
  }

  @Query(() => String, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async generateQuestionAudio(
    @Context() context,
    @Args('sessionId') sessionId: string,
    @Args('questionIndex', { type: () => Int }) questionIndex: number,
  ) {
    // Verify session belongs to user
    const session = await this.aiInterviewService.getInterviewSession(
      sessionId,
      context.req.user.id,
    );
    if (!session) {
      throw new Error('Interview session not found');
    }

    const question = session.questions[questionIndex];
    if (!question) {
      throw new Error('Question not found');
    }

    const result = await this.ttsService.generateSpeech(question, {
      sessionId,
      questionIndex,
      cache: true,
    });

    if (result.success && result.url) {
      return result.url;
    }

    throw new Error(result.error ?? 'Failed to generate audio');
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteInterviewSession(@Context() context, @Args('sessionId') sessionId: string) {
    const result = await this.aiInterviewService.deleteInterviewSession(
      sessionId,
      context.req.user.id,
    );
    return result.success;
  }
}
