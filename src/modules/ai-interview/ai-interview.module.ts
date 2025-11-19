import { Module } from '@nestjs/common';
import { AiInterviewService } from './ai-interview.service';
import { AiInterviewResolver } from './ai-interview.resolver';
import { OllamaService } from './services/ollama.service';
import { TtsService } from './services/tts.service';
import { ReportService } from './services/report.service';

@Module({
  providers: [AiInterviewService, AiInterviewResolver, OllamaService, TtsService, ReportService],
  exports: [AiInterviewService, TtsService, ReportService],
})
export class AiInterviewModule {}
