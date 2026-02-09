import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalysisDocument = Analysis & Document;

@Schema({ strict: false, timestamps: true }) // strict:false — любые поля можно сохранять
export class Analysis {
  // Любое поле, даже если оно будет разного типа
  [key: string]: any;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);