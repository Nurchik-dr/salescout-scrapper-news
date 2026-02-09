import { IsString } from 'class-validator';

export class CreateSearchTaskDto {
  @IsString({ each: true })
  readonly companyId: string;
}