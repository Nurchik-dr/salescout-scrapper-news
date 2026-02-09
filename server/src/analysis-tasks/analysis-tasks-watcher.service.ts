import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalysisTasks, AnalysisTasksDocument } from './schemas/analyze-tasks.schema';
import { Analysis, AnalysisDocument } from '../analyze/schemas/analyze.schema';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class AnalysisTasksWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalysisTasksWatcherService.name);
  private changeStream: any = null;

  constructor(
    @InjectModel(AnalysisTasks.name) private analysisTasksModel: Model<AnalysisTasksDocument>,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
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
      this.changeStream = this.analysisTasksModel.watch(
        [
          {
            $match: {
              operationType: { $in: ['update', 'replace', 'insert'] },
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.changeStream.on('change', (change: any) => {
        this.handleChange(change).catch((err) => {
          this.logger.error('Error handling change:', err);
        });
      });

      this.changeStream.on('error', (error: Error) => {
        this.logger.error('Analysis tasks change stream error:', error);
        setTimeout(() => this.startWatching(), 5000);
      });

      this.logger.log('MongoDB Change Stream started for analysis tasks collection');
    } catch (error) {
      this.logger.error('Failed to start analysis tasks change stream:', error);
    }
  }

  private async stopWatching() {
    if (this.changeStream) {
      await this.changeStream.close();
      this.changeStream = null;
      this.logger.log('Analysis Tasks Change Stream stopped');
    }
  }

  private async handleChange(change: any) {
    const { operationType, fullDocument } = change;

    this.logger.log(`Change stream event received: ${operationType}`);

    if (!fullDocument) {
      this.logger.warn('No fullDocument in change event');
      return;
    }

    this.logger.log(`Analysis task change detected: ${operationType}, status: ${fullDocument.status}, videoId: ${fullDocument.videoId}`);

    let eventName: string;
    let analysisData: any = null;

    switch (fullDocument.status) {
      case 'completed':
        eventName = 'analysis:completed';
        // Подгружаем результат анализа из коллекции Analysis
        try {
          const videoId = fullDocument.videoId;
          analysisData = await this.analysisModel.findOne({
            videoId: new Types.ObjectId(videoId),
          });
          this.logger.log(`Loaded analysis data for videoId: ${videoId}, found: ${!!analysisData}`);
        } catch (error) {
          this.logger.error(`Failed to load analysis data: ${error}`);
        }
        break;
      case 'failed':
        eventName = 'analysis:failed';
        break;
      default:
        eventName = 'analysis:update';
    }

    // Извлекаем данные анализа - если есть поле analysis внутри, берем его
    let analysisPayload = null;
    if (analysisData) {
      const analysisObj = analysisData.toObject();
      // Если в документе есть вложенное поле analysis, используем его
      // Иначе используем весь документ (без служебных полей)
      analysisPayload = analysisObj.analysis || analysisObj;
    }

    this.wsGateway.sendToAll(eventName, {
      taskId: fullDocument._id.toString(),
      videoId: fullDocument.videoId?.toString(),
      companyId: fullDocument.companyId?.toString(),
      status: fullDocument.status,
      analysis: analysisPayload,
      createdAt: fullDocument.createdAt,
      updatedAt: fullDocument.updatedAt,
    });

    this.logger.log(`Sent ${eventName} for analysis task ${fullDocument._id}, videoId: ${fullDocument.videoId}, status: ${fullDocument.status}`);
  }
}
