import { DatabaseModule } from '@app/database';
import { JOB_CRAWLER_QUEUE, QueueService, SharedQueueModule } from '@app/queue';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperProcessor } from './scraper.processor';
import { ScraperService } from './scraper.service';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { ScraperFactory } from './strategies/scraper.factory';

@Module({
  imports: [
    DatabaseModule,
    SharedQueueModule,
    BullModule.registerQueue({
      name: JOB_CRAWLER_QUEUE,
    }),
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    ScraperProcessor,
    ScraperFactory,
    LinkedInStrategy,
    QueueService, // Exported from libs/queue or provided here
  ],
})
export class ScraperModule {}
