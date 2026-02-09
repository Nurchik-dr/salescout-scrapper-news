import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoService } from '../video/video.service';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Analysis } from './schemas/analyze.schema';
import { Company } from '../company/schemas/company.schemas';

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name);
  private readonly aiServerUrl: string;
  private readonly parserServerUrl: string;

  constructor(
    @InjectModel(Analysis.name) private analysisModel: Model<Analysis>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private readonly configService: ConfigService,
    private readonly videoService: VideoService,
  ) {
    this.aiServerUrl = this.configService.get<string>('AI_SERVER_URL') || 'http://localhost:3000';
    this.parserServerUrl = this.configService.get<string>('PARSER_SERVER_URL') || 'http://localhost:8080';
  }

  async analyzeVideo(videoId: string, companyId: string) {

    const video = await this.videoService.findById(videoId);

    const companyObjectId  = new Types.ObjectId(companyId);
    const company = await this.companyModel.findById(companyObjectId)

    if (!video) {
      throw new Error("Не удалось найти видео")
    }
    if (!company) {
      throw new Error("Не удалось найти компанию")
    }

    // Проверяем, существует ли уже анализ для этого видео
    const analysisVideo = await this.analysisModel.findOne({
      videoId: new Types.ObjectId(video._id)
    })


    if(analysisVideo){
      return analysisVideo
    }

    const formatVideo = {
      "videoId": video._id,
      "aboutCompany": company.description,
      "platform": video.platform,
      "author": video.author,
      "description": video.description,
      "views": video.views,
      "likes": video.likes,
      "comments": video.comments,
      "viralScore": video.viralScore,
      "isViral": video.isViral,
      "publishedAt": video.publishedAt,
      "videoURL": video.videoUrl
    }

    try {
      const res = await axios.post(this.parserServerUrl + '/api/analyze', formatVideo);

      const analysisData = {
        ...res.data,
        videoId: new Types.ObjectId(video._id)
      };

      return await this.analysisModel.create(analysisData);
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
      throw error;
    }
  }
}
