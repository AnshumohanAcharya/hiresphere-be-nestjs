import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { getQueueToken } from '@nestjs/bullmq';
import { JOB_CRAWLER_QUEUE, JOB_TASK_TYPES } from './queue.constants';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: '1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken(JOB_CRAWLER_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a sync job to the queue', async () => {
    await service.addJobSyncTask();
    expect(mockQueue.add).toHaveBeenCalledWith(JOB_TASK_TYPES.SYNC_JOBS, expect.any(Object));
  });

  it('should add a detail scrape job to the queue', async () => {
    const jobId = 'test-uuid';
    const url = 'https://linkedin.com/job/123';
    await service.addDetailTask(jobId, url, 'LINKEDIN');

    expect(mockQueue.add).toHaveBeenCalledWith(JOB_TASK_TYPES.SCRAPE_DETAIL, {
      jobId,
      url,
      source: 'LINKEDIN',
    });
  });
});
