import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { UserRole } from './user-role.enum';

@InputType()
export class RegisterDto {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;

  @Field()
  @IsString()
  firstName: string;

  @Field()
  @IsString()
  lastName: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
