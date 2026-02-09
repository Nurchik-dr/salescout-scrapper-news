import dotenv from 'dotenv';
dotenv.config();
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});

export const videoQueue = new Queue('analysis_tasks_queue', { connection });
export const aiAnalysisQueue = new Queue('ai_analysis_queue', { connection });
