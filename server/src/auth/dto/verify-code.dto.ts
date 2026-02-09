import { IsString, Matches } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @Matches(/^[1-9]\d{7,14}$/)
  phoneNumber: string;

  @IsString()
  code: string;
}
