import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { QueryVideoDto } from './dto/query-video.dto';
import { SearchTask, SearchTaskDocument } from '../search/schemas/search-query.schema';
import { Company } from '../company/schemas/company.schemas';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(SearchTask.name) private searchTaskModel: Model<SearchTaskDocument>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async createVideo(dto: CreateVideoDto) {
    const video = new this.videoModel({
      ...dto,
      searchTaskId: new Types.ObjectId(dto.searchTaskId),
      publishedAt: new Date(dto.publishedAt)
    });
    return video.save();
  }

  async getVideos() {
    return this.videoModel.find().exec();
  }

  async getVideosBySearchTask(searchTaskId: string) {
    return this.videoModel.find({ searchTaskId: new Types.ObjectId(searchTaskId) }).exec();
  }

  async findById(id: string): Promise<any> {
    return this.videoModel.findById(id).exec();
  }

  // БЫСТРОЕ РЕШЕНИЕ: Добавить явную конвертацию и обработку

  async getVideosWithPagination(query: QueryVideoDto) {
    const { searchTaskId, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = query;

    const companyObjectId  = new Types.ObjectId(query.companyId);

    // Получаем активную компанию пользователя
    const currentCompany = await this.companyModel.findById(companyObjectId)

    if (!currentCompany) {
      return {
        videos: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Получаем все задачи активной компании
    const companyTasks = await this.searchTaskModel.find({ companyId: companyObjectId }).exec();
    const companyTaskIds = companyTasks.map(task => task._id);

    // Формируем фильтр
    const filter: any = {};

    if (searchTaskId) {
      filter.searchTaskId = new Types.ObjectId(searchTaskId);
    } else if (companyTaskIds.length > 0) {
      filter.searchTaskId = { $in: companyTaskIds };
    } else {
      return {
        videos: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Валидация sortBy - только разрешенные поля
    const allowedSortFields = ['publishedAt', 'views', 'likes', 'comments', 'viralScore'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'publishedAt';


    // Формируем сортировку
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort: any = { [validSortBy]: sortOrder };

    // Добавляем _id как вторичную сортировку для стабильности
    sort._id = sortOrder;


    // Считаем skip для пагинации
    const skip = (page - 1) * limit;

    // Выполняем запросы параллельно
    const [videos, total] = await Promise.all([
      this.videoModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() // Используем lean() для лучшей производительности
        .exec(),
      this.videoModel.countDocuments(filter).exec(),
    ]);

    // Дополнительная проверка и сортировка на уровне приложения (для гарантии)
    if (videos.length > 0 && validSortBy === 'publishedAt') {
      videos.sort((a, b) => {
        const aValue = a[validSortBy];
        const bValue = b[validSortBy];

        // Конвертируем в timestamp для корректного сравнения
        const aTime = aValue ? new Date(aValue).getTime() : 0;
        const bTime = bValue ? new Date(bValue).getTime() : 0;

        if (order === 'desc') {
          return bTime - aTime;
        } else {
          return aTime - bTime;
        }
      });

      // Debug info
      videos.slice(0, 3).forEach((v, i) => {
        console.log(`  ${i + 1}. ${validSortBy}: ${v[validSortBy]}`);
      });
    }

    return {
      videos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
