import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { OllamaService } from './ollama.service';

interface QuestionAnalysis {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  technicalDepth: number;
  relevance: number;
  responseTime: number; // seconds
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private prisma: PrismaService,
    private ollamaService: OllamaService,
  ) {}

  /**
   * Generate comprehensive interview report
   */
  async generateReport(sessionId: string): Promise<any> {
    try {
      const session = await this.prisma.aiInterviewSession.findUnique({
        where: { id: sessionId },
        include: {
          cheatingFlags: true,
          report: true,
        },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // If report already exists, return it
      if (session.report) {
        return session.report;
      }

      // Analyze each question-answer pair
      const questionAnalyses: QuestionAnalysis[] = [];
      const questionTimings = (session.questionTimings as any) || {};

      for (let i = 0; i < session.questions.length; i++) {
        const question = session.questions[i] || '';
        const answer = session.answers[i] || '';

        // Get timing data
        const timing = questionTimings[i] || {};
        const responseTime = timing.duration || 0;

        // Analyze answer using Ollama (only if answer exists)
        let analysis;
        if (answer) {
          analysis = await this.ollamaService.analyzeAnswer(question, answer, {
            jobDescription: session.jobDescription || undefined,
            previousAnswers: session.answers.slice(0, i),
          });
        } else {
          // Default analysis for missing answers
          analysis = {
            score: 0,
            feedback: 'No answer provided',
            strengths: [],
            weaknesses: ['Answer not provided'],
            technicalDepth: 0,
            relevance: 0,
          };
        }

        questionAnalyses.push({
          question: question || '',
          answer: answer || '',
          score: analysis.score || 0,
          feedback: analysis.feedback || '',
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          technicalDepth: analysis.technicalDepth || 0,
          relevance: analysis.relevance || 0,
          responseTime,
        });
      }

      // Generate comprehensive feedback using Ollama
      const comprehensiveFeedback = await this.ollamaService.generateComprehensiveFeedback({
        questions: session.questions,
        answers: session.answers,
        jobDescription: session.jobDescription || undefined,
        roleTitle: session.roleTitle || undefined,
        questionAnalyses: questionAnalyses.map((qa) => ({
          question: qa.question,
          answer: qa.answer,
          score: qa.score,
          feedback: qa.feedback,
        })),
      });

      // Calculate metrics
      const metrics = this.calculateMetrics(questionAnalyses, session);

      // Create report
      const report = await this.prisma.interviewReport.create({
        data: {
          sessionId,
          overallScore: comprehensiveFeedback.overallScore || 0,
          technicalScore: comprehensiveFeedback.technicalScore || null,
          communicationScore: comprehensiveFeedback.communicationScore || null,
          confidenceScore: metrics.confidenceLevel || null,
          questionAnalyses: JSON.parse(JSON.stringify(questionAnalyses)),
          strengths: comprehensiveFeedback.strengths || [],
          weaknesses: comprehensiveFeedback.weaknesses || [],
          improvementAreas: comprehensiveFeedback.improvementAreas || [],
          averageResponseTime: metrics.averageResponseTime || null,
          speechClarity: metrics.speechClarity || null,
          pace: metrics.pace || null,
          fillerWordsCount: metrics.fillerWordsCount || null,
          technicalDepth: metrics.technicalDepth || null,
          relevanceScore: metrics.relevanceScore || null,
          accuracyScore: metrics.accuracyScore || null,
          skillGaps: metrics.skillGaps ? JSON.parse(JSON.stringify(metrics.skillGaps)) : null,
          requirementMatch: metrics.requirementMatch || null,
          confidenceLevel: metrics.confidenceLevel || null,
          engagementLevel: metrics.engagementLevel || null,
          timeManagement: metrics.timeManagement || null,
          hiringRecommendation: comprehensiveFeedback.hiringRecommendation || null,
          detailedFeedback: comprehensiveFeedback.detailedFeedback || '',
          performanceChart: metrics.performanceChart
            ? JSON.parse(JSON.stringify(metrics.performanceChart))
            : null,
          timelineData: metrics.timelineData
            ? JSON.parse(JSON.stringify(metrics.timelineData))
            : null,
        },
      });

      this.logger.log(`Report generated for session ${sessionId}`);

      return report;
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate various metrics from question analyses
   */
  private calculateMetrics(
    questionAnalyses: QuestionAnalysis[],
    session: any,
  ): {
    averageResponseTime: number;
    speechClarity: number;
    pace: number;
    fillerWordsCount: number;
    technicalDepth: number;
    relevanceScore: number;
    accuracyScore: number;
    skillGaps: any;
    requirementMatch: number;
    confidenceLevel: number;
    engagementLevel: number;
    timeManagement: number;
    performanceChart: any;
    timelineData: any;
  } {
    // Average response time
    const totalResponseTime = questionAnalyses.reduce((sum, qa) => sum + qa.responseTime, 0);
    const averageResponseTime =
      questionAnalyses.length > 0 ? totalResponseTime / questionAnalyses.length : 0;

    // Average technical depth
    const avgTechnicalDepth =
      questionAnalyses.reduce((sum, qa) => sum + qa.technicalDepth, 0) / questionAnalyses.length;

    // Average relevance
    const avgRelevance =
      questionAnalyses.reduce((sum, qa) => sum + qa.relevance, 0) / questionAnalyses.length;

    // Calculate pace (words per minute) - estimate based on answer length
    const totalWords = questionAnalyses.reduce((sum, qa) => sum + qa.answer.split(/\s+/).length, 0);
    const totalTime = totalResponseTime / 60; // Convert to minutes
    const pace = totalTime > 0 ? totalWords / totalTime : 0;

    // Estimate filler words (simple heuristic)
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
    const fillerWordsCount = questionAnalyses.reduce((count, qa) => {
      const words = qa.answer.toLowerCase().split(/\s+/);
      return count + words.filter((word) => fillerWords.includes(word)).length;
    }, 0);

    // Speech clarity (based on answer quality and length)
    const speechClarity = Math.min(
      questionAnalyses.reduce((sum, qa) => {
        const clarity = qa.answer.length > 50 ? 0.8 : 0.5;
        return sum + clarity;
      }, 0) / questionAnalyses.length,
      1,
    );

    // Confidence level (based on answer completeness and technical depth)
    const confidenceLevel =
      (avgTechnicalDepth * 0.6 + avgRelevance * 0.4 + speechClarity * 0.3) / 1.3;

    // Engagement level (based on response time and answer quality)
    const engagementLevel = Math.min(
      (1 - Math.min(averageResponseTime / 60, 1)) * 0.5 + avgRelevance * 0.5,
      1,
    );

    // Time management (based on consistent response times)
    const responseTimes = questionAnalyses.map((qa) => qa.responseTime);
    const avgTime = averageResponseTime;
    const timeVariance =
      responseTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) /
      responseTimes.length;
    const timeManagement = Math.max(0, 1 - timeVariance / 100); // Lower variance = better

    // Skill gaps (placeholder - would need job requirements analysis)
    const skillGaps = this.calculateSkillGaps(session, questionAnalyses);

    // Requirement match (based on overall performance)
    const requirementMatch = (avgTechnicalDepth + avgRelevance + confidenceLevel) / 3;

    // Performance chart data
    const performanceChart = {
      scores: questionAnalyses.map((qa, idx) => ({
        question: idx + 1,
        score: qa.score,
        technicalDepth: qa.technicalDepth * 10,
        relevance: qa.relevance * 10,
      })),
      averageScore:
        questionAnalyses.reduce((sum, qa) => sum + qa.score, 0) / questionAnalyses.length,
    };

    // Timeline data
    const timelineData = questionAnalyses.map((qa, idx) => ({
      question: idx + 1,
      timestamp: idx * 60, // Approximate timestamp
      duration: qa.responseTime,
      score: qa.score,
    }));

    return {
      averageResponseTime,
      speechClarity,
      pace,
      fillerWordsCount,
      technicalDepth: avgTechnicalDepth,
      relevanceScore: avgRelevance,
      accuracyScore: avgTechnicalDepth * 0.7 + avgRelevance * 0.3,
      skillGaps,
      requirementMatch,
      confidenceLevel,
      engagementLevel,
      timeManagement,
      performanceChart,
      timelineData,
    };
  }

  /**
   * Calculate skill gaps based on job requirements
   */
  private calculateSkillGaps(session: any, questionAnalyses: QuestionAnalysis[]): any {
    if (!session.extractedSkills || session.extractedSkills.length === 0) {
      return null;
    }

    const gaps: any = {};

    // Simple implementation - would need more sophisticated analysis
    session.extractedSkills.forEach((skill: string) => {
      // Check if skill is mentioned in answers
      const mentioned = questionAnalyses.some((qa) =>
        qa.answer.toLowerCase().includes(skill.toLowerCase()),
      );

      gaps[skill] = {
        required: 'INTERMEDIATE', // Would come from job requirements
        demonstrated: mentioned ? 'INTERMEDIATE' : 'BEGINNER',
        gap: mentioned ? 0 : 1,
      };
    });

    return gaps;
  }

  /**
   * Get report for a session
   */
  async getReport(sessionId: string) {
    return this.prisma.interviewReport.findUnique({
      where: { sessionId },
    });
  }
}
