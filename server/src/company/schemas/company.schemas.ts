import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: [String],
    required: true,
    default: [],
  })
  hotWords: string[];

  @Prop({ trim: true, maxlength: 500 })
  description: string;

  @Prop({ required: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
