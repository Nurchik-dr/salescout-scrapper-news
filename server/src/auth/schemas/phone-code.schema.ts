import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PhoneCodeDocument = PhoneCode & Document;

@Schema({ timestamps: true })
export class PhoneCode {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  code: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const PhoneCodeSchema = SchemaFactory.createForClass(PhoneCode);
