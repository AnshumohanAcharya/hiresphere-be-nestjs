import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_CRAWLER_QUEUE, JOB_TASK_TYPES } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(@InjectQueue(JOB_CRAWLER_QUEUE) private readonly crawlerQueue: Queue) {}

  async addJobSyncTask() {
    return this.crawlerQueue.add(JOB_TASK_TYPES.SYNC_JOBS, { requestedAt: new Date() });
  }

  async addDetailTask(jobId: string, url: string, source: string) {
    return this.crawlerQueue.add(JOB_TASK_TYPES.SCRAPE_DETAIL, { jobId, url, source });
  }
}
