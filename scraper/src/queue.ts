import dotenv from 'dotenv';
dotenv.config();
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const PORT = process.env.PORT || 5000;

const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(PORT),
    maxRetriesPerRequest: null
});

export const videoQueue = new Queue('video_search_queue', { connection });
