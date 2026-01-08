import { Test, TestingModule } from '@nestjs/testing';

import { AiBridgeService } from './ai-bridge.service';

describe('AiBridgeService', () => {
  let service: AiBridgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiBridgeService],
    }).compile();

    service = module.get<AiBridgeService>(AiBridgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
