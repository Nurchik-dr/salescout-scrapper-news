import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryVideoDto {
  @IsOptional()
  @IsString()
  searchTaskId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['views', 'likes', 'viralScore', 'publishedAt'])
  sortBy?: string = 'publishedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: string = 'desc';

  @IsString()
  companyId: string;
}