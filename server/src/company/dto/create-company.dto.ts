import {
  IsString,
  IsArray,
  IsBoolean,
  ArrayNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(500)
  description: string

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  hotWords: string[];

  @IsBoolean()
  isActive: boolean;
}
