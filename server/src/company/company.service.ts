import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './schemas/company.schemas';
import { SearchTask, SearchTaskDocument } from '../search/schemas/search-query.schema';
import { Video, VideoDocument } from '../video/schemas/video.schema';
import { AnalysisTasks, AnalysisTasksDocument } from '../analysis-tasks/schemas/analyze-tasks.schema';
import { Analysis, AnalysisDocument } from '../analyze/schemas/analyze.schema';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
    @InjectModel(SearchTask.name)
    private readonly searchTaskModel: Model<SearchTaskDocument>,
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
    @InjectModel(AnalysisTasks.name)
    private readonly analysisTasksModel: Model<AnalysisTasksDocument>,
    @InjectModel(Analysis.name)
    private readonly analysisModel: Model<AnalysisDocument>,
  ) {}

  async create(userId: string, dto: CreateCompanyDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }


    const company = await this.companyModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      description: dto.description,
      hotWords: dto.hotWords,
      isActive: dto.isActive,
    });

    return company;
  }

  async findAllByUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const companies = await this.companyModel.find({
      userId: new Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    return companies;
  }

  async update(companyId: string, userId: string, dto: UpdateCompanyDto) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company id');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const companyObjectId = new Types.ObjectId(companyId);

    // Проверяем, что кампания принадлежит пользователю
    const company = await this.companyModel.findOne({
      _id: new Types.ObjectId(companyId),
      userId: new Types.ObjectId(userId),
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    this.logger.log(`Updating company: ${company.title}, clearing related data...`);

    // 1. Находим все search tasks компании
    const companyTasks = await this.searchTaskModel.find({ companyId: companyObjectId });
    const taskIds = companyTasks.map((task) => task._id);

    // 2. Находим все видео компании
    let videoIds: Types.ObjectId[] = [];
    if (taskIds.length > 0) {
      const videos = await this.videoModel.find({ searchTaskId: { $in: taskIds } });
      videoIds = videos.map((video) => video._id as Types.ObjectId);
    }

    // 3. Удаляем Analysis по videoIds
    if (videoIds.length > 0) {
      const deletedAnalysis = await this.analysisModel.deleteMany({
        videoId: { $in: videoIds }
      });
      this.logger.log(`Deleted ${deletedAnalysis.deletedCount} analysis records`);
    }

    // 4. Удаляем AnalysisTasks по companyId
    const deletedAnalysisTasks = await this.analysisTasksModel.deleteMany({
      companyId: companyObjectId
    });
    this.logger.log(`Deleted ${deletedAnalysisTasks.deletedCount} analysis tasks`);

    // 5. Удаляем Videos
    if (taskIds.length > 0) {
      const deletedVideos = await this.videoModel.deleteMany({ searchTaskId: { $in: taskIds } });
      this.logger.log(`Deleted ${deletedVideos.deletedCount} videos`);
    }

    // 6. Удаляем SearchTasks
    const deletedTasks = await this.searchTaskModel.deleteMany({ companyId: companyObjectId });
    this.logger.log(`Deleted ${deletedTasks.deletedCount} search tasks`);

    // Обновляем компанию
    const updatedCompany = await this.companyModel.findByIdAndUpdate(
      new Types.ObjectId(companyId),
      dto,
      { new: true },
    );

    return updatedCompany;
  }

  async delete(companyId: string, userId: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company id');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const companyObjectId = new Types.ObjectId(companyId);

    // Проверяем, что кампания принадлежит пользователю
    const company = await this.companyModel.findOne({
      _id: companyObjectId,
      userId: new Types.ObjectId(userId),
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    this.logger.log(`Starting cascade delete for company: ${company.title} (${companyId})`);

    // 1. Находим все search tasks компании
    const companyTasks = await this.searchTaskModel.find({ companyId: companyObjectId });
    const taskIds = companyTasks.map((task) => task._id);

    // 2. Находим все видео компании
    let videoIds: Types.ObjectId[] = [];
    if (taskIds.length > 0) {
      const videos = await this.videoModel.find({ searchTaskId: { $in: taskIds } });
      videoIds = videos.map((video) => video._id as Types.ObjectId);
    }

    // 3. Удаляем Analysis по videoIds
    let deletedAnalysisCount = 0;
    if (videoIds.length > 0) {
      const deletedAnalysis = await this.analysisModel.deleteMany({
        videoId: { $in: videoIds }
      });
      deletedAnalysisCount = deletedAnalysis.deletedCount;
      this.logger.log(`Deleted ${deletedAnalysisCount} analysis records`);
    }

    // 4. Удаляем AnalysisTasks по companyId
    const deletedAnalysisTasks = await this.analysisTasksModel.deleteMany({
      companyId: companyObjectId
    });
    this.logger.log(`Deleted ${deletedAnalysisTasks.deletedCount} analysis tasks`);

    // 5. Удаляем Videos
    let deletedVideosCount = 0;
    if (taskIds.length > 0) {
      const deletedVideos = await this.videoModel.deleteMany({ searchTaskId: { $in: taskIds } });
      deletedVideosCount = deletedVideos.deletedCount;
      this.logger.log(`Deleted ${deletedVideosCount} videos`);
    }

    // 6. Удаляем SearchTasks
    const deletedTasks = await this.searchTaskModel.deleteMany({ companyId: companyObjectId });
    this.logger.log(`Deleted ${deletedTasks.deletedCount} search tasks`);

    // 7. Удаляем саму компанию
    await this.companyModel.findByIdAndDelete(companyObjectId);
    this.logger.log(`Deleted company: ${company.title}`);

    return {
      message: 'Company deleted successfully',
      deletedSearchTasks: deletedTasks.deletedCount,
      deletedVideos: deletedVideosCount,
      deletedAnalysisTasks: deletedAnalysisTasks.deletedCount,
      deletedAnalysis: deletedAnalysisCount,
    };
  }

  async getActiveCompany(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const activeCompany = await this.companyModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    return activeCompany;
  }
}
