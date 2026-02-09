import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { Video, VideoSchema } from './schemas/video.schema';
import { SearchTask, SearchTaskSchema } from '../search/schemas/search-query.schema';
import { Company, CompanySchema } from '../company/schemas/company.schemas';
import { VideoWatcherService } from './video-watcher.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: SearchTask.name, schema: SearchTaskSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    WebSocketModule,
  ],
  controllers: [VideoController],
  providers: [VideoService, VideoWatcherService],
  exports: [VideoService],
})
export class VideoModule {}
