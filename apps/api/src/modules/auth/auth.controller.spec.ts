import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  // 1. Create a mock object that matches the AuthService interface
  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
    login: jest.fn().mockResolvedValue({ access_token: 'mock_token' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // 2. Tell Nest to use our mock whenever AuthService is requested
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
