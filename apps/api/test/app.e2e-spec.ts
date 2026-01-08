import request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@app/database';

import { ApiModule } from '../src/api.module';

describe('ApiController (e2e)', () => {
  let app: INestApplication;

  // Create a mock that satisfies the Prisma interface
  const mockDatabaseService = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
    })
      .overrideProvider(DatabaseService) // 👈 Swaps the real DB with our mock
      .useValue(mockDatabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
