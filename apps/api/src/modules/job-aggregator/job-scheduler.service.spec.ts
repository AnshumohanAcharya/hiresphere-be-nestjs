import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { JobSchedulerService } from './job-scheduler.service';

describe('JobSchedulerService', () => {
  let service: JobSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSchedulerService,
        {
          provide: getQueueToken('job-crawler-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobSchedulerService>(JobSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
