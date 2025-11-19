import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';
    this.model = this.configService.get<string>('OLLAMA_MODEL') ?? 'llama3:8b';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minutes timeout for LLM responses
    });

    this.logger.log(`Ollama service initialized with model: ${this.model}`);
  }

  /**
   * Generate interview questions based on job description and role
   */
  async generateQuestions(
    jobDescription?: string,
    roleTitle?: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
  ): Promise<string[]> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(jobDescription, roleTitle, difficulty);

      const response = await this.httpClient.post('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      });

      const generatedText = response.data.response;
      const questions = this.parseQuestions(generatedText);

      this.logger.log(`Generated ${questions.length} interview questions`);
      return questions;
    } catch (error) {
      this.logger.error('Error generating questions:', error);
      // Return fallback questions if generation fails
      return this.getFallbackQuestions(roleTitle);
    }
  }

  /**
   * Analyze candidate answer and provide feedback
   */
  async analyzeAnswer(
    question: string,
    answer: string,
    context?: {
      jobDescription?: string;
      previousAnswers?: string[];
    },
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    technicalDepth: number;
    relevance: number;
  }> {
    try {
      const prompt = this.buildAnswerAnalysisPrompt(question, answer, context);

      const response = await this.httpClient.post('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 800,
        },
      });

      const analysisText = response.data.response;
      return this.parseAnswerAnalysis(analysisText, answer);
    } catch (error) {
      this.logger.error('Error analyzing answer:', error);
      // Return basic analysis if LLM fails
      return this.getBasicAnalysis(answer);
    }
  }

  /**
   * Generate follow-up question based on previous answer
   */
  async generateFollowUpQuestion(
    previousAnswer: string,
    originalQuestion: string,
  ): Promise<string | null> {
    try {
      const prompt = `Based on this interview answer, generate a relevant follow-up question that probes deeper into the topic. Keep it concise (one sentence).

Original Question: ${originalQuestion}
Answer: ${previousAnswer}

Follow-up Question:`;

      const response = await this.httpClient.post('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.8,
          num_predict: 100,
        },
      });

      const followUp = response.data.response.trim();
      return followUp ?? null;
    } catch (error) {
      this.logger.error('Error generating follow-up question:', error);
      return null;
    }
  }

  /**
   * Generate comprehensive feedback for the entire interview
   */
  async generateComprehensiveFeedback(sessionData: {
    questions: string[];
    answers: string[];
    jobDescription?: string;
    roleTitle?: string;
    questionAnalyses?: Array<{
      question: string;
      answer: string;
      score: number;
      feedback: string;
    }>;
  }): Promise<{
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    detailedFeedback: string;
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    hiringRecommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'REJECT';
  }> {
    try {
      const prompt = this.buildComprehensiveFeedbackPrompt(sessionData);

      const response = await this.httpClient.post('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.6,
          num_predict: 1500,
        },
      });

      const feedbackText = response.data.response;
      return this.parseComprehensiveFeedback(feedbackText, sessionData);
    } catch (error) {
      this.logger.error('Error generating comprehensive feedback:', error);
      return this.getBasicComprehensiveFeedback(sessionData);
    }
  }

  /**
   * Extract skills and requirements from job description
   */
  async extractJobDetails(jobDescription: string): Promise<{
    skills: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    requirements: string[];
  }> {
    try {
      const prompt = `Extract key information from this job description. Return a JSON object with:
- skills: array of technical skills mentioned
- difficulty: one of EASY, MEDIUM, HARD based on experience requirements
- requirements: array of key requirements

Job Description:
${jobDescription}

JSON Response:`;

      const response = await this.httpClient.post('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
        },
      });

      const jsonText = response.data.response;
      return this.parseJobDetails(jsonText);
    } catch (error) {
      this.logger.error('Error extracting job details:', error);
      return {
        skills: [],
        difficulty: 'MEDIUM',
        requirements: [],
      };
    }
  }

  // Private helper methods

  private buildQuestionGenerationPrompt(
    jobDescription?: string,
    roleTitle?: string,
    difficulty: string = 'MEDIUM',
  ): string {
    let prompt = `Generate 8-10 professional interview questions for a ${roleTitle ?? 'software engineer'} position. `;

    if (jobDescription) {
      prompt += `Based on this job description:\n\n${jobDescription}\n\n`;
    }

    prompt += `Difficulty level: ${difficulty}\n\n`;
    prompt += `Generate questions that assess:\n`;
    prompt += `1. Technical skills and experience\n`;
    prompt += `2. Problem-solving abilities\n`;
    prompt += `3. Communication skills\n`;
    prompt += `4. Cultural fit and teamwork\n\n`;
    prompt += `Format: One question per line, numbered. Questions should be clear and specific.\n\n`;
    prompt += `Questions:`;

    return prompt;
  }

  private parseQuestions(text: string): string[] {
    // Extract questions from the response
    const lines = text.split('\n').filter((line) => line.trim());
    const questions: string[] = [];

    for (const line of lines) {
      // Remove numbering (1., 2., etc.) and clean up
      const cleaned = line.replace(/^\d+[.)]\s*/, '').trim();
      if (cleaned && cleaned.length > 20 && cleaned.endsWith('?')) {
        questions.push(cleaned);
      }
    }

    // If parsing failed, try to extract questions differently
    if (questions.length === 0) {
      const questionMatches = text.match(/\d+[.)]\s*([^?\n]+[?])/g);
      if (questionMatches) {
        questions.push(...questionMatches.map((q) => q.replace(/^\d+[.)]\s*/, '').trim()));
      }
    }

    // Fallback: split by question marks
    if (questions.length === 0) {
      const parts = text.split('?').filter((p) => p.trim().length > 20);
      questions.push(...parts.slice(0, 10).map((p) => `${p.trim()}?`));
    }

    return questions.slice(0, 10); // Limit to 10 questions
  }

  private buildAnswerAnalysisPrompt(
    question: string,
    answer: string,
    context?: {
      jobDescription?: string;
      previousAnswers?: string[];
    },
  ): string {
    let prompt = `Analyze this interview answer and provide detailed feedback in JSON format:
{
  "score": number (0-10),
  "feedback": "detailed feedback text",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "technicalDepth": number (0-1),
  "relevance": number (0-1)
}

Question: ${question}
Answer: ${answer}
`;

    if (context?.jobDescription) {
      prompt += `\nJob Context: ${context.jobDescription.substring(0, 200)}...\n`;
    }

    prompt += `\nAnalysis:`;

    return prompt;
  }

  private parseAnswerAnalysis(
    text: string,
    answer: string,
  ): {
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    technicalDepth: number;
    relevance: number;
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(Math.max(parsed.score ?? 5, 0), 10),
          feedback: parsed.feedback ?? 'No specific feedback provided.',
          strengths: parsed.strengths ?? [],
          weaknesses: parsed.weaknesses ?? [],
          technicalDepth: Math.min(Math.max(parsed.technicalDepth ?? 0.5, 0), 1),
          relevance: Math.min(Math.max(parsed.relevance ?? 0.5, 0), 1),
        };
      }
    } catch (_error) {
      this.logger.warn('Failed to parse JSON from analysis, using fallback');
    }

    return this.getBasicAnalysis(answer);
  }

  private buildComprehensiveFeedbackPrompt(sessionData: {
    questions: string[];
    answers: string[];
    jobDescription?: string;
    roleTitle?: string;
    questionAnalyses?: Array<{
      question: string;
      answer: string;
      score: number;
      feedback: string;
    }>;
  }): string {
    let prompt = `Generate comprehensive interview feedback in JSON format:
{
  "overallScore": number (0-10),
  "technicalScore": number (0-10),
  "communicationScore": number (0-10),
  "detailedFeedback": "comprehensive text feedback",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvementAreas": ["area1", "area2"],
  "hiringRecommendation": "STRONG_HIRE" | "HIRE" | "CONSIDER" | "REJECT"
}

Interview Summary:
- Role: ${sessionData.roleTitle ?? 'Software Engineer'}
- Total Questions: ${sessionData.questions.length}
- Answers Provided: ${sessionData.answers.length}
`;

    if (sessionData.jobDescription) {
      prompt += `\nJob Description: ${sessionData.jobDescription.substring(0, 300)}...\n`;
    }

    if (sessionData.questionAnalyses && sessionData.questionAnalyses.length > 0) {
      prompt += `\nPer-Question Analysis:\n`;
      sessionData.questionAnalyses.forEach((qa, idx) => {
        prompt += `${idx + 1}. Q: ${qa.question}\n   Score: ${qa.score}/10\n`;
      });
    }

    prompt += `\nComprehensive Feedback:`;

    return prompt;
  }

  private parseComprehensiveFeedback(
    text: string,
    sessionData: any,
  ): {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    detailedFeedback: string;
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    hiringRecommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'REJECT';
  } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overallScore: Math.min(Math.max(parsed.overallScore ?? 5, 0), 10),
          technicalScore: Math.min(Math.max(parsed.technicalScore ?? 5, 0), 10),
          communicationScore: Math.min(Math.max(parsed.communicationScore ?? 5, 0), 10),
          detailedFeedback: parsed.detailedFeedback ?? 'Comprehensive analysis completed.',
          strengths: parsed.strengths ?? [],
          weaknesses: parsed.weaknesses ?? [],
          improvementAreas: parsed.improvementAreas ?? [],
          hiringRecommendation: parsed.hiringRecommendation ?? 'CONSIDER',
        };
      }
    } catch (_error) {
      this.logger.warn('Failed to parse comprehensive feedback JSON, using fallback');
    }

    return this.getBasicComprehensiveFeedback(sessionData);
  }

  private parseJobDetails(text: string): {
    skills: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    requirements: string[];
  } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(parsed.difficulty)
            ? parsed.difficulty
            : 'MEDIUM',
          requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        };
      }
    } catch (_error) {
      this.logger.warn('Failed to parse job details JSON');
    }

    return {
      skills: [],
      difficulty: 'MEDIUM',
      requirements: [],
    };
  }

  private getFallbackQuestions(roleTitle?: string): string[] {
    return [
      `Tell me about yourself and your experience as a ${roleTitle ?? 'software engineer'}.`,
      'What programming languages are you most comfortable with?',
      'Describe a challenging project you worked on and how you solved it.',
      'How do you approach debugging and problem-solving?',
      "What's your experience with version control and collaboration tools?",
      'How do you stay updated with new technologies and best practices?',
      'Describe a time when you had to learn a new technology quickly.',
      "What's your approach to writing clean, maintainable code?",
    ];
  }

  private getBasicAnalysis(answer: string): {
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    technicalDepth: number;
    relevance: number;
  } {
    const length = answer.length;
    const score = Math.min(Math.max(Math.floor(length / 20), 1), 10);

    return {
      score,
      feedback:
        length > 50
          ? 'Answer provided with adequate detail. Consider adding more technical specifics.'
          : 'Answer is too brief. Please provide more detail and examples.',
      strengths: length > 50 ? ['Provided detailed response'] : [],
      weaknesses: length <= 50 ? ['Answer too brief'] : [],
      technicalDepth: Math.min(length / 200, 1),
      relevance: 0.6,
    };
  }

  private getBasicComprehensiveFeedback(sessionData: any): {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    detailedFeedback: string;
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    hiringRecommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'REJECT';
  } {
    const avgAnswerLength =
      sessionData.answers.reduce((sum: number, a: string) => sum + a.length, 0) /
      sessionData.answers.length;
    const overallScore = Math.min(Math.max(Math.floor(avgAnswerLength / 30), 1), 10);

    return {
      overallScore,
      technicalScore: overallScore,
      communicationScore: overallScore,
      detailedFeedback: `Interview completed with ${sessionData.answers.length} answers provided. Average answer length: ${Math.round(avgAnswerLength)} characters.`,
      strengths: ['Completed all questions'],
      weaknesses: avgAnswerLength < 50 ? ['Brief answers'] : [],
      improvementAreas: ['Provide more detailed examples'],
      hiringRecommendation: (() => {
        if (overallScore >= 7) {
          return 'HIRE';
        }
        if (overallScore >= 5) {
          return 'CONSIDER';
        }
        return 'REJECT';
      })(),
    };
  }
}
