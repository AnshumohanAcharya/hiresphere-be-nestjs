import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeResolver } from './resume.resolver';

@Module({
  providers: [ResumeService, ResumeResolver],
  exports: [ResumeService],
})
export class ResumeModule {}
