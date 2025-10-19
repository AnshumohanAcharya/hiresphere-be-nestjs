import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StartAiInterviewDto } from './dto/start-ai-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class AiInterviewService {
  constructor(private prisma: PrismaService) {}

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
      // Generate AI feedback and score
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
    // This is a simplified version. In a real implementation, you would:
    // 1. Analyze the job requirements
    // 2. Use AI to generate relevant questions
    // 3. Consider the candidate's skills and experience

    const generalQuestions = [
      'Tell me about yourself and your experience in software development.',
      'What programming languages are you most comfortable with?',
      'Describe a challenging project you worked on and how you solved it.',
      'How do you approach debugging and problem-solving?',
      "What's your experience with version control and collaboration tools?",
      'How do you stay updated with new technologies and best practices?',
      'Describe a time when you had to learn a new technology quickly.',
      "What's your approach to writing clean, maintainable code?",
      'How do you handle code reviews and feedback?',
      'What are your career goals and how does this role fit into them?',
    ];

    if (jobId) {
      // Get job-specific questions based on job requirements
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
        const skillQuestions = job.skills.map(
          (jobSkill) => `What's your experience with ${jobSkill.skill.name}?`,
        );
        return [...skillQuestions, ...generalQuestions.slice(0, 5)];
      }
    }

    return generalQuestions.slice(0, 8);
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
