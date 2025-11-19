import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly enabled: boolean;
  private readonly model: string;
  private readonly outputDir: string;
  private readonly pythonVenv: string;
  private readonly scriptPath: string;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<string>('TTS_ENABLED') === 'true';
    this.model = this.configService.get<string>('TTS_MODEL') ?? 'tts_models/en/ljspeech/glow-tts';
    this.outputDir = this.configService.get<string>('TTS_OUTPUT_DIR') ?? './uploads/audio';
    this.pythonVenv = this.configService.get<string>('TTS_PYTHON_VENV') ?? '../venv-tts';
    // Script path relative to project root
    this.scriptPath = path.join(process.cwd(), 'scripts/tts/generate_speech.py');

    // Ensure output directory exists
    void this.ensureOutputDirectory();

    this.logger.log(`TTS service initialized - Enabled: ${this.enabled}, Model: ${this.model}`);
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(
    text: string,
    options?: {
      sessionId?: string;
      questionIndex?: number;
      cache?: boolean;
    },
  ): Promise<{
    success: boolean;
    filePath?: string;
    url?: string;
    error?: string;
  }> {
    if (!this.enabled) {
      this.logger.warn('TTS is disabled');
      return {
        success: false,
        error: 'TTS is disabled',
      };
    }

    try {
      // Generate filename
      const filename = this.generateFilename(text, options);
      const filePath = path.join(this.outputDir, filename);

      // Check cache if enabled
      if (options?.cache) {
        try {
          await fs.access(filePath);
          this.logger.log(`Using cached audio file: ${filename}`);
          return {
            success: true,
            filePath,
            url: `/api/audio/${filename}`,
          };
        } catch {
          // File doesn't exist, will generate new one
        }
      }

      // Generate speech using Python script
      const pythonPath = path.join(process.cwd(), this.pythonVenv, 'bin', 'python');

      const command = `"${pythonPath}" "${this.scriptPath}" "${this.escapeText(text)}" "${filePath}" "${this.model ?? 'tts_models/en/ljspeech/glow-tts'}"`;

      this.logger.log(`Generating speech for text: ${text.substring(0, 50)}...`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 seconds timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr && !stderr.includes('WARNING')) {
        this.logger.warn(`TTS script stderr: ${stderr}`);
      }

      const result = JSON.parse(stdout);

      if (result.success) {
        // Get the actual filename from the result path (might be .aiff or .wav)
        const actualFilename = path.basename(result.path);
        this.logger.log(`Speech generated successfully: ${actualFilename}`);
        return {
          success: true,
          filePath: result.path,
          url: `/api/audio/${actualFilename}`,
        };
      }
      this.logger.error(`TTS generation failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
      };
    } catch (error) {
      this.logger.error(`Error generating speech: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message ?? 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate speech for multiple texts (batch processing)
   */
  async generateBatchSpeech(
    texts: string[],
    options?: {
      sessionId?: string;
      cache?: boolean;
    },
  ): Promise<Array<{ text: string; filePath?: string; url?: string; error?: string }>> {
    const results: Array<{ text: string; filePath?: string; url?: string; error?: string }> = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text) {
        continue;
      }

      const result = await this.generateSpeech(text, {
        ...options,
        questionIndex: i,
      });

      results.push({
        text,
        filePath: result.filePath ?? undefined,
        url: result.url ?? undefined,
        error: result.error ?? undefined,
      });

      // Small delay to avoid overwhelming the system
      if (i < texts.length - 1) {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 500);
        });
      }
    }

    return results;
  }

  /**
   * Check if TTS is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get audio file path
   */
  getAudioPath(filename: string): string {
    return path.join(this.outputDir, filename);
  }

  /**
   * Delete audio file
   */
  async deleteAudioFile(filename: string): Promise<boolean> {
    try {
      const filePath = this.getAudioPath(filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to delete audio file ${filename}: ${error.message}`);
      return false;
    }
  }

  // Private helper methods

  private generateFilename(
    text: string,
    options?: { sessionId?: string; questionIndex?: number },
  ): string {
    // Create a hash-like filename from text
    const textHash = this.simpleHash(text);
    const timestamp = Date.now();

    if (options?.sessionId && options?.questionIndex !== undefined) {
      return `session_${options.sessionId}_q${options.questionIndex}_${textHash}.wav`;
    }

    return `tts_${timestamp}_${textHash}.wav`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  private escapeText(text: string): string {
    // Escape quotes and special characters for shell command
    return text.replace(/"/g, '\\"').replace(/\$/g, '\\$');
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create output directory: ${error.message}`);
    }
  }
}
