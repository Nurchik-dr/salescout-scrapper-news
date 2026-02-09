import { IsString, IsNumber, IsBoolean, IsOptional, IsMongoId } from 'class-validator';

export class CreateVideoDto {
  @IsMongoId()
  readonly searchTaskId: string;

  @IsString()
  readonly url: string;

  @IsString()
  readonly videoUrl: string;

  @IsString()
  readonly previewUrl: string;

  @IsString()
  readonly platform?: string;

  @IsString()
  readonly description?: string;

  @IsString()
  readonly author: string;

  @IsString()
  readonly publishedAt: string;

  @IsNumber()
  readonly views: number;

  @IsNumber()
  readonly likes: number;

  @IsNumber()
  readonly comments: number;

  @IsNumber()
  readonly growthPercent: number;

  @IsNumber()
  readonly viralScore: number;

  @IsOptional()
  @IsBoolean()
  readonly isViral?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly isAd?: boolean;
}
