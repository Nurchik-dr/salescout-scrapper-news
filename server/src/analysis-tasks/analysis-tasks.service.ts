import { Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  AnalysisTasks,
  AnalysisTasksDocument,
} from './schemas/analyze-tasks.schema';
import { Analysis, AnalysisDocument } from '../analyze/schemas/analyze.schema';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Video, VideoDocument } from '../video/schemas/video.schema';

// Статусы, означающие что анализ в процессе
const PROCESSING_STATUSES = ['pending', 'parsing', 'analysis'];

@Injectable()
export class AnalysisTasksService {
  constructor(
    @InjectModel(AnalysisTasks.name) private analysisTasksModel: Model<AnalysisTasksDocument>,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectQueue('analysis_tasks_queue') private analysisQueue: Queue,
  ) {
  }

  async analyzeVideo(videoId: string, companyId: string) {
    const videoObjectId = new Types.ObjectId(videoId);
    const companyObjectId = new Types.ObjectId(companyId);

    const video = await this.videoModel.findById(videoObjectId);

    if (!video) {
      throw new NotFoundException('Не удалось найти видео по запросу');
    }

    // Проверяем, есть ли уже задача для этого видео
    const existingTask = await this.analysisTasksModel.findOne({
      videoId: videoObjectId,
    });

    if (existingTask) {
      const isProcessing = PROCESSING_STATUSES.includes(existingTask.status);

      // Если анализ завершен, подгружаем результат из коллекции Analysis
      let analysisPayload = null;
      if (existingTask.status === 'completed') {
        const analysisData = await this.analysisModel.findOne({
          videoId: videoObjectId,
        });
        if (analysisData) {
          const analysisObj = analysisData.toObject();
          // Если в документе есть вложенное поле analysis, используем его
          // Иначе используем весь документ
          analysisPayload = analysisObj.analysis || analysisObj;
        }
      }

      // Возвращаем существующую задачу с флагом isProcessing и данными анализа
      return {
        ...existingTask.toObject(),
        isProcessing,
        analysis: analysisPayload,
        message: isProcessing
          ? 'Анализ уже выполняется'
          : existingTask.status === 'completed'
            ? 'Анализ завершен'
            : 'Анализ завершился с ошибкой',
      };
    }

    // Создаем новую задачу
    const task = {
      videoId: videoObjectId,
      companyId: companyObjectId,
      status: 'pending',
    };

    const createdTask = await this.analysisTasksModel.create(task);

    await this.analysisQueue.add('scrape', {
      taskId: createdTask._id.toString(),
      videoUrl: video.videoUrl,
    }, {
      removeOnComplete: true,
    });

    return {
      ...createdTask.toObject(),
      isProcessing: true,
      message: 'Анализ запущен',
    };
  }
}
