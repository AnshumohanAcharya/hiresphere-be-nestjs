import { DatabaseService, JobSource } from '@app/database';
import { JOB_CRAWLER_QUEUE, JOB_TASK_TYPES } from '@app/queue';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ScraperFactory } from './strategies/scraper.factory';
@Processor(JOB_CRAWLER_QUEUE)
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly scraperFactory: ScraperFactory,
    @InjectQueue(JOB_CRAWLER_QUEUE) private readonly crawlerQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case JOB_TASK_TYPES.SYNC_JOBS:
        // We'll scrape all enabled sources
        return this.handleSyncJobs([JobSource.LINKEDIN]);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleSyncJobs(sources: JobSource[]) {
    // Create a record for this scraping session
    const scrapeLog = await this.db.scrape.create({
      data: {
        workerId: `worker-${process.pid}`,
        status: 'IN_PROGRESS',
      },
    });

    let totalFound = 0;

    try {
      for (const source of sources) {
        const strategy = this.scraperFactory.getStrategy(source);
        const jobs = await strategy.scrape('Node.js', 'Remote');

        for (const jobData of jobs) {
          const exists = await this.db.job.findUnique({
            where: { externalId: jobData.externalId },
          });

          if (!exists) {
            const { companyName, ...jobFields } = jobData;
            const newJob = await this.db.job.create({
              data: {
                ...jobFields,
                company: {
                  connectOrCreate: { where: { name: companyName }, create: { name: companyName } },
                },
              },
            });

            await this.crawlerQueue.add(JOB_TASK_TYPES.SCRAPE_DETAIL, {
              jobId: newJob.id,
              url: newJob.url,
              source: newJob.source,
              scrapeLogId: scrapeLog.id, // Pass the log ID to track progress
            });
            totalFound++;
          }
        }
      }

      // Update log with success
      await this.db.scrape.update({
        where: { id: scrapeLog.id },
        data: {
          status: 'COMPLETED',
          jobsFound: totalFound,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        this.logger.error(`Sync failed: ${error.message}`);
      }
      await this.db.scrape.update({
        where: { id: scrapeLog.id },
        data: { status: 'FAILED', completedAt: new Date() },
      });
    }
  }
  private async handleScrapeDetail(data: { jobId: string; url: string; source: JobSource }) {
    this.logger.log(`Fetching details for job: ${data.jobId}`);
    const strategy = this.scraperFactory.getStrategy(data.source);

    try {
      const fullDescription = await strategy.scrapeDetail(data.url);

      await this.db.job.update({
        where: { id: data.jobId },
        data: {
          rawDescription: fullDescription,
          isProcessed: false, // Flag for the AI-Bridge to pick up
        },
      });
    } catch (err) {
      if (err instanceof Error && 'code' in err) {
        this.logger.error(`Failed to fetch detail for ${data.jobId}: ${err.message}`);
      }
    }
  }
}
