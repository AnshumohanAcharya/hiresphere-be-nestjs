import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthHelpers } from './helpers'; // Import the new helper

describe('AuthService', () => {
  let service: AuthService;

  // Create Mocks
  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockAuthHelpers = {
    generateTokens: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthHelpers, useValue: mockAuthHelpers }, // Provide the mock helper
        // JwtService and ConfigService are usually used inside AuthHelpers now,
        // but if AuthService still uses them, keep them here.
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
