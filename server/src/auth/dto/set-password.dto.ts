import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  tempToken: string;

  @IsString()
  @MinLength(6)
  password: string;
}
