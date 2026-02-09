import { Schema, model } from 'mongoose';

const SearchTaskSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotWord: { type: String, required: true },
    status: { type: String, enum: ['pending', 'connect', 'analyze', 'process', 'completed', 'failed'], default: 'pending' },
    platform: { type: String, default: 'instagram' },
    lastRunAt: { type: Date },
    totalVideos: { type: Number, default: 0 },
    processedVideos: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
}, { timestamps: true });

export const SearchTaskModel = model('SearchTask', SearchTaskSchema);
