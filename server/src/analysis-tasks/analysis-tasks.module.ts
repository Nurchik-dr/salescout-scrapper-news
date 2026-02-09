import { Module } from '@nestjs/common';
import { AnalysisTasksService } from './analysis-tasks.service';
import { AnalyzeTasksController } from './analysis-tasks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import {
  AnalysisTasks,
  AnalysisTasksSchema,
} from './schemas/analyze-tasks.schema';
import { Video, VideoSchema } from '../video/schemas/video.schema';
import { Company, CompanySchema } from '../company/schemas/company.schemas';
import { Analysis, AnalysisSchema } from '../analyze/schemas/analyze.schema';
import { WebSocketModule } from '../websocket/websocket.module';
import { AnalysisTasksWatcherService } from './analysis-tasks-watcher.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalysisTasks.name, schema: AnalysisTasksSchema },
      { name: Video.name, schema: VideoSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
    BullModule.registerQueue({
      name: 'analysis_tasks_queue'
    }),
    WebSocketModule,
  ],
  controllers: [AnalyzeTasksController],
  providers: [AnalysisTasksService, AnalysisTasksWatcherService],
})
export class AnalysisTasksModule {}
