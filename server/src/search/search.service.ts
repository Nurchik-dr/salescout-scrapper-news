import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';
import { CreateSearchTaskDto } from './dto/create-search-task.dto';
import { SearchTask, SearchTaskDocument } from './schemas/search-query.schema';
import { Video, VideoDocument } from '../video/schemas/video.schema';
import { Company } from '../company/schemas/company.schemas';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(SearchTask.name) private searchTaskModel: Model<SearchTaskDocument>,
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectQueue('video_search_queue') private searchQueue: Queue,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  // Создать задачи для всех hot-words активной компании пользователя
  async createTasks(userId: string, dto?: CreateSearchTaskDto) {
    const userObjectId = new Types.ObjectId(userId);
    const companyObjectId  = new Types.ObjectId(dto?.companyId);

    // Получаем активную компанию пользователя
    const currentCompany = await this.companyModel.findById(companyObjectId);

    if (!currentCompany) {
      throw new NotFoundException('Компания не найдена');
    }

    if (!currentCompany.hotWords || currentCompany.hotWords.length === 0) {
      throw new NotFoundException('У компании нет ключевых слов');
    }

    // Проверяем, есть ли уже завершенные задачи для этой компании
    const existingCompletedTasks = await this.searchTaskModel.find({
      companyId: companyObjectId,
      status: 'completed',
    });

    // Если есть завершенные задачи для этой компании - не создаем новые
    if (existingCompletedTasks.length > 0) {
      return existingCompletedTasks;
    }

    // Находим все старые задачи этой компании
    const oldTasks = await this.searchTaskModel.find({ companyId: companyObjectId });

    const oldTaskIds = oldTasks.map((task) => task._id);

    // Удаляем все видео, связанные со старыми задачами
    if (oldTaskIds.length > 0) {
      await this.videoModel.deleteMany({ searchTaskId: { $in: oldTaskIds } });
    }

    // Удаляем все старые задачи компании
    await this.searchTaskModel.deleteMany({ companyId: companyObjectId });

    // Создаем новые задачи на основе hotWords из активной компании
    const tasks = currentCompany.hotWords.map((word) => ({
      userId: userObjectId,
      companyId: companyObjectId,
      hotWord: word,
      status: 'pending',
      platform: 'instagram',
    }));

    const createdTasks = await this.searchTaskModel.insertMany(tasks);

    // Отправляем задачи в очередь для Scraper Worker
    for (const task of createdTasks) {
      await this.searchQueue.add('scrape', {
        taskId: task._id.toString(),
        hotWord: task.hotWord,
        platform: task.platform,
      });
    }

    return createdTasks;
  }

  // Получить все задачи всех активных компаний пользователя
  async getTasks(companyId: string) {
    const companyObjectId  = new Types.ObjectId(companyId);

    // Возвращаем задачи текущей компании компаний
    const tasks = await this.searchTaskModel.find({
      companyId: companyObjectId,
    });

     return tasks;
  }

  // Обновить статус задачи
  async updateStatus(taskId: string, status: string, progress?: number) {
    const updateData: any = { status };
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    const task = await this.searchTaskModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true },
    );

    if (task) {
      // Отправляем WebSocket событие
      const eventName = status === 'completed' ? 'task:completed' : 'task:update';
      this.wsGateway.sendToAll(eventName, {
        taskId: task._id.toString(),
        companyId: task.companyId.toString(),
        status: task.status,
        progress: task.progress,
        hotWord: task.hotWord,
      });
    }

    return task;
  }

  // Обновить прогресс задачи
  async updateProgress(taskId: string, progress: number, processedVideos?: number, totalVideos?: number) {
    const updateData: any = { progress };
    if (processedVideos !== undefined) updateData.processedVideos = processedVideos;
    if (totalVideos !== undefined) updateData.totalVideos = totalVideos;

    const task = await this.searchTaskModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true },
    );

    if (task) {
      this.wsGateway.sendToAll('task:update', {
        taskId: task._id.toString(),
        companyId: task.companyId.toString(),
        status: task.status,
        progress: task.progress,
        processedVideos: task.processedVideos,
        totalVideos: task.totalVideos,
        hotWord: task.hotWord,
      });
    }

    return task;
  }
}
