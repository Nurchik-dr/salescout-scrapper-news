import { Schema, model } from 'mongoose';

const VideoSchema = new Schema({
    searchTaskId: { type: Schema.Types.ObjectId, ref: 'SearchTask', required: true },
    platform: { type: String, enum: ['instagram', 'tiktok'], required: true },
    videoId: { type: String, required: true },
    url: String,
    videoUrl: String,
    previewUrl: { type: String, required: true },
    author: { type: String, required: true },
    description: String,
    publishedAt: { type: Date, required: true },
    views: { type: Number, required: true },
    likes: { type: Number, required: true },
    comments: { type: Number, required: true },
    growthPercent: { type: Number, required: true },
    metricsHistory: [
        { views: Number, likes: Number, comments: Number, timestamp: { type: Date, default: Date.now } }
    ],
    isAd: { type: Boolean, default: false },
    adScore: { type: Number, default: 0 },
    viralScore: { type: Number, required: true },
    isViral: { type: Boolean, default: false },
}, { timestamps: true });

export const VideoModel = model('Video', VideoSchema);
