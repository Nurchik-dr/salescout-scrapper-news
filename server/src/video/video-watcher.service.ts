import
{ Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class VideoWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoWatcherService.name);
  private changeStream: any = null;

  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  async onModuleInit() {
    this.startWatching();
  }

  async onModuleDestroy() {
    await this.stopWatching();
  }

  private startWatching() {
    try {
      // Следим за изменениями в коллекции videos
      this.changeStream = this.videoModel.watch(
        [
          {
            $match: {
              operationType: { $in: ['insert', 'update', 'replace'] },
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.changeStream.on('change', (change: any) => {
        this.handleChange(change);
      });

      this.changeStream.on('error', (error) => {
        this.logger.error('Change stream error:', error);
        // Переподключаемся через 5 секунд
        setTimeout(() => this.startWatching(), 5000);
      });

      this.logger.log('MongoDB Change Stream started for videos collection');
    } catch (error) {
      this.logger.error('Failed to start change stream:', error);
    }
  }

  private async stopWatching() {
    if (this.changeStream) {
      await this.changeStream.close();
      this.changeStream = null;
      this.logger.log('MongoDB Change Stream stopped');
    }
  }

  private handleChange(change: any) {
    const { operationType, fullDocument } = change;

    if (!fullDocument) {
      return;
    }

    this.logger.debug(`Video change detected: ${operationType}`);

    if (operationType === 'insert') {
      // Новое видео добавлено - уведомляем клиентов
      this.wsGateway.sendToAll('video:new', {
        video: {
          _id: fullDocument._id.toString(),
          searchTaskId: fullDocument.searchTaskId?.toString(),
          videoId: fullDocument.videoId,
          previewUrl: fullDocument.previewUrl,
          platform: fullDocument.platform,
          description: fullDocument.description,
          author: fullDocument.author,
          publishedAt: fullDocument.publishedAt,
          url: fullDocument.url,
          videoUrl: fullDocument.videoUrl,
          views: fullDocument.views,
          likes: fullDocument.likes,
          comments: fullDocument.comments,
          viralScore: fullDocument.viralScore,
          isViral: fullDocument.isViral,
          isAd: fullDocument.isAd,
        },
      });

      this.logger.log(`Sent video:new event for video ${fullDocument.videoId}`);
    } else if (operationType === 'update' || operationType === 'replace') {
      // Видео обновлено - уведомляем клиентов
      this.wsGateway.sendToAll('video:updated', {
        video: {
          _id: fullDocument._id.toString(),
          searchTaskId: fullDocument.searchTaskId?.toString(),
          views: fullDocument.views,
          likes: fullDocument.likes,
          comments: fullDocument.comments,
          viralScore: fullDocument.viralScore,
          isViral: fullDocument.isViral,
        },
      });
    }
  }
}
