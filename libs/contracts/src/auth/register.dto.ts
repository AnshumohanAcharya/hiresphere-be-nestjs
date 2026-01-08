import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'A valid professional email is required' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12, {
    message: 'Security Standard: Password must be at least 12 characters',
  })
  @MaxLength(64, { message: 'Password is too long (Max 64 characters)' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
