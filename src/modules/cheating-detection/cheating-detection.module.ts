import { Module } from '@nestjs/common';
import { CheatingDetectionService } from './cheating-detection.service';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CheatingDetectionService],
  exports: [CheatingDetectionService],
})
export class CheatingDetectionModule {}
