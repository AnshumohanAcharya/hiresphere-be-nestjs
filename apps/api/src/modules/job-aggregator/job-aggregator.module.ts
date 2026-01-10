import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { SharedQueueModule, JOB_CRAWLER_QUEUE } from '@app/queue';
import { JobSchedulerService } from './job-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Required for @Cron to work
    SharedQueueModule,
    BullModule.registerQueue({
      name: JOB_CRAWLER_QUEUE,
    }),
  ],
  providers: [JobSchedulerService],
})
export class JobAggregatorModule {}
