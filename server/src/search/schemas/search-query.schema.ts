import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SearchTaskDocument = SearchTask & Document;

@Schema({ timestamps: true })
export class SearchTask {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  hotWord: string;

  @Prop({ enum: ['pending', 'connect', 'analyze', 'process', 'completed', 'failed'], default: 'pending' })
  status: string;

  @Prop({ default: 0 })
  totalVideos: number;

  @Prop({ default: 0 })
  processedVideos: number;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: 'instagram' })
  platform: string;

  @Prop()
  lastRunAt?: Date;
}

export const SearchTaskSchema = SchemaFactory.createForClass(SearchTask);
