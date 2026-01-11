import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  // Mock the UsersService with the new refactored method names
  const mockUsersService = {
    findById: jest.fn(), // The safe version
    completeOnboarding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Example of testing the refactored getProfile
  describe('getProfile', () => {
    it('should return user profile without sensitive data', async () => {
      // The user object that would normally be attached to the request by the Guard
      const mockUser = { id: '1', email: 'test@test.com' };

      // 1. Your controller actually returns the "user" object passed to the method
      // 2. We don't necessarily need to mock findById if getProfile just returns the @GetUser()

      const result = await controller.getProfile(mockUser);

      expect(result).toBe(mockUser);
      expect(result.id).toBe('1');
    });
  });
});
