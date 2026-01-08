import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DatabaseService,
          // We use a mock object that mimics the structure of Prisma
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            $connect: jest.fn(),
            $disconnect: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
