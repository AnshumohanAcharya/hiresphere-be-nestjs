import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@app/database';

import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockDatabaseService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks(); // Good practice to reset mocks between tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user and return it without the password', async () => {
      const userData = {
        email: 'test@test.com',
        name: 'Anshu',
        password: 'hashed_password',
      };
      mockDatabaseService.user.create.mockResolvedValue({
        ...userData,
        id: 'uuid-123',
      });

      const result = await service.create(
        { email: 'test@test.com', name: 'Anshu' } as any,
        'hashed_password',
      );

      expect(result).not.toHaveProperty('password');
      expect(mockDatabaseService.user.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);
      const result = await service.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('completeOnboarding', () => {
    it('should update onboarding data and set status to COMPLETED', async () => {
      const userId = 'user-1';
      const dto = {
        targetRoles: ['Dev'],
        targetLocations: ['Remote'],
        preferredStack: ['Node'],
      };

      mockDatabaseService.user.update.mockResolvedValue({
        id: userId,
        onboardingStep: 'COMPLETED',
      });

      const result = await service.completeOnboarding(userId, dto as any);

      expect(result.onboardingStep).toBe('COMPLETED');
      expect(mockDatabaseService.user.update).toHaveBeenCalled();
    });

    it('should throw an error if database update fails', async () => {
      mockDatabaseService.user.update.mockRejectedValue(new Error('DB Error'));

      await expect(service.completeOnboarding('1', {} as any)).rejects.toThrow('DB Error');
    });
  });
});
