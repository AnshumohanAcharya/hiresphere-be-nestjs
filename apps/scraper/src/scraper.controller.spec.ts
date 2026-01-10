import { Test, TestingModule } from '@nestjs/testing';
import { ScraperController } from './scraper.controller';
import { QueueService } from '@app/queue';

describe('ScraperController', () => {
  let controller: ScraperController;
  let queueService: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScraperController],
      providers: [
        {
          provide: QueueService,
          useValue: {
            addJobSyncTask: jest.fn().mockResolvedValue({ id: 'job-123' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ScraperController>(ScraperController);
    queueService = module.get<QueueService>(QueueService);
  });

  it('should trigger a sync and return a success message', async () => {
    const spy = jest.spyOn(queueService, 'addJobSyncTask');

    const result = await controller.triggerSync();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      message: 'Global job synchronization task has been queued.',
      status: 'success',
    });
  });
});
