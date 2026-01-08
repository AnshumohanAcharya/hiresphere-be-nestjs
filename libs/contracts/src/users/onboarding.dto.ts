import { IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class OnboardingDto {
  @IsArray()
  @IsString({ each: true })
  targetRoles: string[];

  @IsArray()
  @IsString({ each: true })
  targetLocations: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  minSalary?: number;

  @IsArray()
  @IsString({ each: true })
  preferredStack: string[];
}
