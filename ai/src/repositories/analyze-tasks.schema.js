import { Schema, model } from 'mongoose';

const AnalysisTasksSchema = new Schema({
    videoId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    status: { type: String, enum: ['pending', 'parsing', 'analysis', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true })

export const AnalysisTasksModel = model('AnalysisTasks', AnalysisTasksSchema);
