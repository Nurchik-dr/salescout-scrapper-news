// video.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VideoDocument = Video & Document;

// Вложенная схема для истории метрик
@Schema({ _id: false })
class MetricsSnapshot {
  @Prop({ required: true })
  views: number;

  @Prop({ required: true })
  likes: number;

  @Prop({ required: true })
  comments: number;

  @Prop({ required: true })
  viralScore: number;

  @Prop({ required: true, type: Date })
  timestamp: Date;
}

// Вложенная схема для роста метрик
@Schema({ _id: false })
class MetricsGrowth {
  @Prop({ default: 0 })
  viewsGrowth: number;

  @Prop({ default: 0 })
  likesGrowth: number;

  @Prop({ default: 0 })
  commentsGrowth: number;

  @Prop({ default: 0 })
  viralScoreGrowth: number;

  @Prop({ type: Date })
  calculatedAt: Date;
}

@Schema({ timestamps: true })
export class Video {
  @Prop({ type: Types.ObjectId, ref: 'SearchTask', required: true })
  searchTaskId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  videoId: string; // Уникальный ID от Instagram

  @Prop({ required: true })
  previewUrl: string;

  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true, type: Date })
  publishedAt: Date;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  videoUrl: string;

  // Текущие метрики
  @Prop({ required: true })
  views: number;

  @Prop({ required: true })
  likes: number;

  @Prop({ required: true })
  comments: number;

  @Prop({ required: true })
  viralScore: number;

  @Prop({ default: false })
  isViral: boolean;

  @Prop({ default: false })
  isAd: boolean;

  // Рост метрик (для отображения +500 и т.д.)
  @Prop({ type: MetricsGrowth })
  metricsGrowth: MetricsGrowth;

  // История всех скрапингов
  @Prop({ type: [MetricsSnapshot], default: [] })
  metricsHistory: MetricsSnapshot[];

  // Даты отслеживания
  @Prop({ type: Date })
  firstScrapedAt: Date;

  @Prop({ type: Date })
  lastScrapedAt: Date;

  // Счетчик: сколько раз подряд видео НЕ вирусное
  @Prop({ default: 0 })
  nonViralCount: number;
}

export const VideoSchema = SchemaFactory.createForClass(Video);

// Создаем индекс для быстрого поиска по videoId
VideoSchema.index({ videoId: 1 });
VideoSchema.index({ searchTaskId: 1 });