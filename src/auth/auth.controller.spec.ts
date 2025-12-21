import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should call authService.signup with valid signup data', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        tenantName: 'Test Gym',
      };

      const expectedResult = {
        member: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'jwt-token',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(service.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle signup validation errors', async () => {
      const invalidSignupDto = {
        email: 'invalid-email',
        password: 'short',
        name: '',
        tenantName: '',
      };

      // Note: In a real scenario, validation pipes would handle this
      // This test demonstrates the controller's basic functionality
      mockAuthService.signup.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      await expect(controller.signup(invalidSignupDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST /auth/login', () => {
    it('should call authService.login with valid login data', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        member: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'jwt-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle login authentication errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
