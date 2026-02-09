import { IsString, IsNumber, IsOptional } from 'class-validator';

export class AnalyzeVideoDto {
  @IsString()
  videoId: string;

  @IsString()
  url: string;

  @IsNumber()
  views: number;

  @IsNumber()
  likes: number;

  @IsNumber()
  comments: number;

  @IsNumber()
  viralScore: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export interface AnalysisResult {
  format: string;
  hook: string;
  structure: string[];
  scenarioTemplate: string;
  onScreenText: string[];
  duration: string;
  style: string;
  whyItWorked: string[];
  repeatChecklist: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  data?: {
    videoId: string;
    url: string;
    metrics: {
      views: number;
      likes: number;
      comments: number;
      viralScore: number;
    };
    analysis: AnalysisResult;
  };
  error?: string;
}
