import { Controller, Post, Get, Patch, Body, Req, UseGuards, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { CreateSearchTaskDto } from './dto/create-search-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Post('tasks')
  async createTasks(@Req() req, @Body() dto: CreateSearchTaskDto) {
    return this.searchService.createTasks(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:companyId')
  async getTasks(@Req() req, @Param('companyId') companyId: string) {
    console.log('companyId', companyId);
    return this.searchService.getTasks(companyId);
  }

  // Эндпоинт для обновления статуса задачи (для scraper worker)
  @Patch('tasks/:taskId/status')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() body: { status: string; progress?: number },
  ) {
    return this.searchService.updateStatus(taskId, body.status, body.progress);
  }

  // Эндпоинт для обновления прогресса задачи (для scraper worker)
  @Patch('tasks/:taskId/progress')
  async updateTaskProgress(
    @Param('taskId') taskId: string,
    @Body() body: { progress: number; processedVideos?: number; totalVideos?: number },
  ) {
    return this.searchService.updateProgress(
      taskId,
      body.progress,
      body.processedVideos,
      body.totalVideos,
    );
  }
}
