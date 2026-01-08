import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsString()
  @MinLength(12, {
    message: 'Password must be at least 12 characters (Standard)',
  })
  password: string;

  @IsString()
  name: string;
}
