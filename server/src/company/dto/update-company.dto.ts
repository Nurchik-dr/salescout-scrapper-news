import {
  IsString,
  IsArray,
  IsBoolean,
  ArrayNotEmpty,
  MinLength,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  hotWords?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
