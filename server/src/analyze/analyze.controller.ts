import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { VideoService } from '../video/video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeService: AnalyzeService,
    private readonly videoService: VideoService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async analyzeVideo(@Body() body: {companyId: string, videoId: string}) {
    return await this.analyzeService.analyzeVideo(body.videoId, body.companyId);
  }
}
