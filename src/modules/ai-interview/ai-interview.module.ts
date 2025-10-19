import { Module } from '@nestjs/common';
import { AiInterviewService } from './ai-interview.service';
import { AiInterviewResolver } from './ai-interview.resolver';

@Module({
  providers: [AiInterviewService, AiInterviewResolver],
  exports: [AiInterviewService],
})
export class AiInterviewModule {}
