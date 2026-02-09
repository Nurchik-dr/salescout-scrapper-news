import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchTask, SearchTaskDocument } from './schemas/search-query.schema';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class TaskWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskWatcherService.name);
  private changeStream: any = null;

  constructor(
    @InjectModel(SearchTask.name) private searchTaskModel: Model<SearchTaskDocument>,
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
      this.changeStream = this.searchTaskModel.watch(
        [
          {
            $match: {
              operationType: { $in: ['update', 'replace'] },
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.changeStream.on('change', (change: any) => {
        this.handleChange(change);
      });

      this.changeStream.on('error', (error: Error) => {
        this.logger.error('Task change stream error:', error);
        setTimeout(() => this.startWatching(), 5000);
      });

      this.logger.log('MongoDB Change Stream started for search tasks collection');
    } catch (error) {
      this.logger.error('Failed to start task change stream:', error);
    }
  }

  private async stopWatching() {
    if (this.changeStream) {
      await this.changeStream.close();
      this.changeStream = null;
      this.logger.log('Task Change Stream stopped');
    }
  }

  private handleChange(change: any) {
    const { operationType, fullDocument } = change;

    if (!fullDocument) {
      return;
    }

    this.logger.debug(`Task change detected: ${operationType}, status: ${fullDocument.status}`);

    const eventName = fullDocument.status === 'completed' ? 'task:completed' : 'task:update';

    this.wsGateway.sendToAll(eventName, {
      taskId: fullDocument._id.toString(),
      companyId: fullDocument.companyId?.toString(),
      status: fullDocument.status,
      progress: fullDocument.progress,
      processedVideos: fullDocument.processedVideos,
      totalVideos: fullDocument.totalVideos,
      hotWord: fullDocument.hotWord,
    });

    this.logger.log(`Sent ${eventName} for task ${fullDocument._id}, status: ${fullDocument.status}, progress: ${fullDocument.progress}`);
  }
}