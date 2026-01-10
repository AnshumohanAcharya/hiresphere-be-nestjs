import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { QueueService } from '@app/queue';
import { JobSource } from '@app/database';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Manually trigger the global sync process.
   * POST /scraper/trigger-sync
   */
  @Post('trigger-sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync() {
    await this.queueService.addJobSyncTask();
    return {
      status: 'success',
      message: 'Global job synchronization task has been queued.',
    };
  }

  /**
   * Manually trigger a detail scrape for a specific URL.
   * Useful for re-scraping failed jobs.
   * POST /scraper/scrape-detail
   */
  @Post('scrape-detail')
  async triggerDetailScrape(@Body() data: { jobId: string; url: string; source: JobSource }) {
    await this.queueService.addDetailTask(data.jobId, data.url, data.source);
    return {
      status: 'success',
      message: `Detail scrape task for job ${data.jobId} queued.`,
    };
  }

  /**
   * Health check to ensure the Scraper app is alive.
   * GET /scraper/health
   */
  @Get('health')
  getHealth() {
    return { status: 'up', timestamp: new Date().toISOString() };
  }
}
