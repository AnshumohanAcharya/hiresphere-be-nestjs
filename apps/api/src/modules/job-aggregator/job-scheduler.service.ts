import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB_CRAWLER_QUEUE, JOB_TASK_TYPES } from '@app/queue';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(@InjectQueue(JOB_CRAWLER_QUEUE) private readonly crawlerQueue: Queue) {}

  /**
   * Triggers the "Sync Jobs" task periodically
   * This pushes a task to Redis for the Scraper Worker to pull
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleSyncTrigger() {
    this.logger.log('Initiating scheduled job synchronization...');

    try {
      await this.crawlerQueue.add(
        JOB_TASK_TYPES.SYNC_JOBS,
        {
          triggeredAt: new Date().toISOString(),
          reason: 'Scheduled Cron Job',
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true, // Keep Redis memory clean
        },
      );
      this.logger.log('Sync task successfully pushed to Event Bus.');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        this.logger.error('Failed to push sync task to queue', error.stack);
      }
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualTrigger() {
    return this.handleSyncTrigger();
  }
}
