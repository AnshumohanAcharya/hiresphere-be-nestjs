import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as stringSimilarity from 'string-similarity';
import { CheatingFlagType } from '../../../generated/prisma';

interface CheatingDetectionData {
  multipleFaces?: boolean;
  faceCount?: number;
  tabSwitches?: number;
  tabSwitchCount?: number;
  cvText?: string;
  answerText?: string;
  audioAnomalies?: {
    longSilence?: boolean;
    backgroundNoise?: boolean;
    echo?: boolean;
  };
  timestamp: Date;
}

@Injectable()
export class CheatingDetectionService {
  private readonly logger = new Logger(CheatingDetectionService.name);
  private readonly threshold: number;

  constructor(private prisma: PrismaService) {
    this.threshold = parseFloat(process.env.CHEATING_THRESHOLD || '0.7');
  }

  /**
   * Process cheating detection data and create flags
   */
  async processDetectionData(
    sessionId: string,
    detectionData: CheatingDetectionData,
  ): Promise<{
    flagsCreated: number;
    cheatingScore: number;
    suspiciousActivities: string[];
  }> {
    const flags: Array<{
      type: CheatingFlagType;
      severity: number;
      description: string;
      evidence?: any;
    }> = [];
    const suspiciousActivities: string[] = [];

    // 1. Multiple Faces Detection
    if (detectionData.multipleFaces || (detectionData.faceCount && detectionData.faceCount > 1)) {
      const severity = Math.min((detectionData.faceCount || 2) / 5, 1);
      flags.push({
        type: CheatingFlagType.MULTIPLE_FACES,
        severity,
        description: `Multiple faces detected (${detectionData.faceCount || 2} faces)`,
        evidence: { faceCount: detectionData.faceCount },
      });
      suspiciousActivities.push('Multiple faces detected in video feed');
    }

    // 2. Tab Switching Detection
    if (
      detectionData.tabSwitches ||
      (detectionData.tabSwitchCount && detectionData.tabSwitchCount > 3)
    ) {
      const switchCount = detectionData.tabSwitchCount || detectionData.tabSwitches || 0;
      const severity = Math.min(switchCount / 10, 1);
      flags.push({
        type: CheatingFlagType.TAB_SWITCHING,
        severity,
        description: `Excessive tab switching detected (${switchCount} switches)`,
        evidence: { switchCount },
      });
      suspiciousActivities.push(`Tab switched ${switchCount} times during interview`);
    }

    // 3. CV/Resume Mismatch
    if (detectionData.cvText && detectionData.answerText) {
      const similarity = this.compareTextSimilarity(detectionData.cvText, detectionData.answerText);
      if (similarity < 0.3) {
        // Low similarity might indicate answer doesn't match CV claims
        flags.push({
          type: CheatingFlagType.CV_MISMATCH,
          severity: 0.5,
          description: 'Answer content does not align with CV/resume information',
          evidence: { similarity },
        });
        suspiciousActivities.push('Answer content mismatch with CV');
      }
    }

    // 4. Audio Anomalies
    if (detectionData.audioAnomalies) {
      if (detectionData.audioAnomalies.longSilence) {
        flags.push({
          type: CheatingFlagType.AUDIO_ANOMALY,
          severity: 0.4,
          description: 'Long periods of silence detected',
          evidence: detectionData.audioAnomalies,
        });
        suspiciousActivities.push('Long silence periods detected');
      }

      if (detectionData.audioAnomalies.backgroundNoise) {
        flags.push({
          type: CheatingFlagType.BACKGROUND_NOISE,
          severity: 0.3,
          description: 'Unusual background noise detected',
          evidence: detectionData.audioAnomalies,
        });
        suspiciousActivities.push('Background noise anomalies');
      }

      if (detectionData.audioAnomalies.echo) {
        flags.push({
          type: CheatingFlagType.AUDIO_ANOMALY,
          severity: 0.5,
          description: 'Echo detected in audio (possible external audio source)',
          evidence: detectionData.audioAnomalies,
        });
        suspiciousActivities.push('Audio echo detected');
      }
    }

    // Create flags in database
    let flagsCreated = 0;
    for (const flag of flags) {
      try {
        await this.prisma.cheatingFlag.create({
          data: {
            sessionId,
            type: flag.type,
            severity: flag.severity,
            timestamp: detectionData.timestamp,
            description: flag.description,
            evidence: flag.evidence ? JSON.parse(JSON.stringify(flag.evidence)) : null,
          },
        });
        flagsCreated++;
      } catch (error) {
        this.logger.error(`Failed to create cheating flag: ${error.message}`);
      }
    }

    // Calculate overall cheating score (0-1, lower is better)
    const cheatingScore =
      flags.length > 0 ? flags.reduce((sum, flag) => sum + flag.severity, 0) / flags.length : 0;

    // Update session with cheating score
    if (flagsCreated > 0) {
      try {
        await this.prisma.aiInterviewSession.update({
          where: { id: sessionId },
          data: {
            cheatingScore,
            suspiciousActivities: {
              set: suspiciousActivities,
            },
          },
        });
      } catch (error) {
        this.logger.error(`Failed to update session cheating score: ${error.message}`);
      }
    }

    this.logger.log(
      `Processed cheating detection for session ${sessionId}: ${flagsCreated} flags, score: ${cheatingScore.toFixed(2)}`,
    );

    return {
      flagsCreated,
      cheatingScore,
      suspiciousActivities,
    };
  }

  /**
   * Compare CV text with answer text for similarity
   */
  private compareTextSimilarity(cvText: string, answerText: string): number {
    // Extract key terms from CV
    const cvTerms = this.extractKeyTerms(cvText);
    const answerTerms = this.extractKeyTerms(answerText);

    // Calculate similarity
    if (cvTerms.length === 0 || answerTerms.length === 0) {
      return 0.5; // Neutral if we can't extract terms
    }

    // Use string similarity library
    const similarity = stringSimilarity.compareTwoStrings(
      cvTerms.join(' ').toLowerCase(),
      answerTerms.join(' ').toLowerCase(),
    );

    return similarity;
  }

  /**
   * Extract key terms from text (simple implementation)
   */
  private extractKeyTerms(text: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word));

    // Return unique words
    return Array.from(new Set(words)).slice(0, 20);
  }

  /**
   * Get cheating flags for a session
   */
  async getSessionFlags(sessionId: string) {
    return this.prisma.cheatingFlag.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Calculate overall cheating score for a session
   */
  async calculateSessionCheatingScore(sessionId: string): Promise<number> {
    const flags = await this.getSessionFlags(sessionId);

    if (flags.length === 0) {
      return 0;
    }

    // Weighted average of flag severities
    const totalSeverity = flags.reduce((sum, flag) => sum + flag.severity, 0);
    return totalSeverity / flags.length;
  }

  /**
   * Check if session has high cheating risk
   */
  async isHighRisk(sessionId: string): Promise<boolean> {
    const score = await this.calculateSessionCheatingScore(sessionId);
    return score >= this.threshold;
  }
}
