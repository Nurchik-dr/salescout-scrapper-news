import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { QueryVideoDto } from './dto/query-video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async createVideo(@Body() dto: CreateVideoDto) {
    return this.videoService.createVideo(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getVideos(@Req() req, @Query() query: QueryVideoDto) {
    return this.videoService.getVideosWithPagination(query);
  }
}
