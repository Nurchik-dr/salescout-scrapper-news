import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalysisTasksDocument = AnalysisTasks & Document;

@Schema({ strict: false, timestamps: true })
export class AnalysisTasks {
  @Prop({ type: Types.ObjectId, ref: 'Video', required: true })
  videoId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ enum: ['pending', 'parsing', 'analysis', 'completed', 'failed'], default: 'pending' })
  status: string;
}

export const AnalysisTasksSchema = SchemaFactory.createForClass(AnalysisTasks);