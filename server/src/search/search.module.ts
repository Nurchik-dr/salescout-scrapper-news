import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchTask, SearchTaskSchema } from './schemas/search-query.schema';
import { Video, VideoSchema } from '../video/schemas/video.schema';
import { Company, CompanySchema } from '../company/schemas/company.schemas';
import { WebSocketModule } from '../websocket/websocket.module';
import { TaskWatcherService } from './task-watcher.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SearchTask.name, schema: SearchTaskSchema },
      { name: Video.name, schema: VideoSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    BullModule.registerQueue({
      name: 'video_search_queue',
    }),
    WebSocketModule,
  ],
  providers: [SearchService, TaskWatcherService],
  controllers: [SearchController],
})

export class SearchModule {}
