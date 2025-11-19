import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StartAiInterviewDto } from './dto/start-ai-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { OllamaService } from './services/ollama.service';

@Injectable()
export class AiInterviewService {
  constructor(
    private prisma: PrismaService,
    private ollamaService: OllamaService,
  ) {}

  async startInterview(userId: string, startInterviewDto: StartAiInterviewDto) {
    // Generate interview questions based on job requirements or general skills
    const questions = await this.generateQuestions(startInterviewDto.jobId);

    const interview = await this.prisma.aiInterviewSession.create({
      data: {
        userId,
        jobId: startInterviewDto.jobId,
        questions,
        status: 'IN_PROGRESS',
      },
    });

    return {
      ...interview,
      currentQuestion: questions[0],
      questionIndex: 0,
      totalQuestions: questions.length,
    };
  }

  async submitAnswer(sessionId: string, userId: string, submitAnswerDto: SubmitAnswerDto) {
    const session = await this.prisma.aiInterviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'IN_PROGRESS',
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found or not active');
    }

    const currentAnswers = session.answers || [];
    const newAnswers = [...currentAnswers, submitAnswerDto.answer];

    const isLastQuestion = newAnswers.length >= session.questions.length;

    const updatedSession = await this.prisma.aiInterviewSession.update({
      where: { id: sessionId },
      data: {
        answers: newAnswers,
        status: isLastQuestion ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isLastQuestion ? new Date() : undefined,
      },
    });

    if (isLastQuestion) {
      // Generate AI feedback and score using Ollama
      try {
        const comprehensiveFeedback = await this.ollamaService.generateComprehensiveFeedback({
          questions: session.questions,
          answers: newAnswers,
          jobDescription: session.jobDescription || undefined,
          roleTitle: session.roleTitle || undefined,
        });

        await this.prisma.aiInterviewSession.update({
          where: { id: sessionId },
          data: {
            score: Math.round(comprehensiveFeedback.overallScore),
            feedback: comprehensiveFeedback.detailedFeedback,
          },
        });

        return {
          ...updatedSession,
          score: Math.round(comprehensiveFeedback.overallScore),
          feedback: comprehensiveFeedback.detailedFeedback,
          isCompleted: true,
        };
      } catch (error) {
        // Fallback to basic feedback if Ollama fails
        const { score, feedback } = this.generateFeedback(session.questions, newAnswers);

        await this.prisma.aiInterviewSession.update({
          where: { id: sessionId },
          data: { score, feedback },
        });

        return {
          ...updatedSession,
          score,
          feedback,
          isCompleted: true,
        };
      }
    }

    return {
      ...updatedSession,
      currentQuestion: session.questions[newAnswers.length],
      questionIndex: newAnswers.length,
      totalQuestions: session.questions.length,
      isCompleted: false,
    };
  }

  async getInterviewSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiInterviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    return session;
  }

  async getUserInterviewSessions(userId: string) {
    return this.prisma.aiInterviewSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  private async generateQuestions(jobId?: string): Promise<string[]> {
    try {
      let jobDescription: string | undefined;
      let roleTitle: string | undefined;
      let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';

      if (jobId) {
        // Get job details for better question generation
        const job = await this.prisma.job.findUnique({
          where: { id: jobId },
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
          },
        });

        if (job) {
          jobDescription = job.description;
          roleTitle = job.title;

          // Extract difficulty from job requirements
          if (job.requirements) {
            const reqLower = job.requirements.toLowerCase();
            if (reqLower.includes('senior') || reqLower.includes('expert')) {
              difficulty = 'HARD';
            } else if (reqLower.includes('junior') || reqLower.includes('entry')) {
              difficulty = 'EASY';
            }
          }

          // Use Ollama to generate questions
          const questions = await this.ollamaService.generateQuestions(
            jobDescription,
            roleTitle,
            difficulty,
          );

          if (questions && questions.length > 0) {
            return questions;
          }
        }
      }

      // Fallback: Generate general questions using Ollama
      const questions = await this.ollamaService.generateQuestions(
        undefined,
        'Software Engineer',
        'MEDIUM',
      );

      return questions.length > 0 ? questions : this.getFallbackQuestions();
    } catch (error) {
      // If Ollama fails, use fallback questions
      return this.getFallbackQuestions();
    }
  }

  private getFallbackQuestions(): string[] {
    return [
      'Tell me about yourself and your experience in software development.',
      'What programming languages are you most comfortable with?',
      'Describe a challenging project you worked on and how you solved it.',
      'How do you approach debugging and problem-solving?',
      "What's your experience with version control and collaboration tools?",
      'How do you stay updated with new technologies and best practices?',
      'Describe a time when you had to learn a new technology quickly.',
      "What's your approach to writing clean, maintainable code?",
    ];
  }

  private generateFeedback(
    _questions: string[],
    answers: string[],
  ): { score: number; feedback: string } {
    // This is a simplified version. In a real implementation, you would:
    // 1. Use AI/ML models to analyze the answers
    // 2. Consider technical accuracy, communication skills, experience level
    // 3. Generate detailed, constructive feedback

    // Simple scoring based on answer length and keywords
    let score = 0;
    const technicalKeywords = [
      'experience',
      'project',
      'technology',
      'problem',
      'solution',
      'code',
      'development',
    ];

    answers.forEach((answer) => {
      if (answer.length > 50) {
        score += 1;
      }
      const keywordCount = technicalKeywords.filter((keyword) =>
        answer.toLowerCase().includes(keyword),
      ).length;
      score += keywordCount * 0.5;
    });

    score = Math.min(Math.max(Math.round(score), 1), 10);

    let feedback: string;
    if (score >= 7) {
      feedback =
        'Strong responses demonstrating good technical knowledge and communication skills.';
    } else if (score >= 5) {
      feedback = 'Good responses with room for improvement in technical depth and clarity.';
    } else {
      feedback =
        'Responses need more detail and technical specificity to better showcase your skills.';
    }

    return { score, feedback };
  }
}
