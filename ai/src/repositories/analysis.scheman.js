import {model, Schema} from "mongoose";

const AnalysisShema = new Schema({
    success: { type: Boolean, required: true },
    videoId: {type: Schema.Types.ObjectId, ref: 'Video', required: true },
    platform: { type: String, required: true },
    provider: { type: String, required: true },
    analyzedAt: {type: Date, required: true },
    analysisTime: {type: String, required: true },
    analysis: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const AnalysisModel = model('Analysis', AnalysisShema);