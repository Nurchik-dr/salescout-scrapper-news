import { Schema, model } from 'mongoose';

const CompanySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    hotWords: {type: [String], required: true, default: [] },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const CompanyModel = model('Company', CompanySchema);
