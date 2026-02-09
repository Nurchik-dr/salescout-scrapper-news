import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AnalysisTasksService } from './analysis-tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analysis-tasks')
export class AnalyzeTasksController {
  constructor(
    private readonly analysisTasksService: AnalysisTasksService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async analyzeVideo(@Body() body: {companyId: string, videoId: string}) {
    return await this.analysisTasksService.analyzeVideo(body.videoId, body.companyId);
  }
}
