import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetLocations?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minSalary?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStack?: string[];
}
