import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { scrapeInstagram, updatePostMetrics } from './scraper';
import { SearchTaskModel } from './search-task.model';
import { VideoModel } from './video.model';

// Подключаем MongoDB
mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Подключение к Redis
const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

connection.on('connect', () => console.log('✅ Connected to Redis'));
connection.on('error', (err) => console.error('❌ Redis connection error:', err));

// Worker для обработки задач поиска
const searchWorker = new Worker(
    'video_search_queue',
    async (job: Job) => {
        const { taskId, hotWord, platform } = job.data;
        console.log(`\n🎯 Processing task ${taskId}: ${platform} - ${hotWord}`);

        try {
            // Обновляем статус на "processing"
            await SearchTaskModel.findByIdAndUpdate(taskId, {
                status: 'processing',
                lastRunAt: new Date()
            });

            if (platform === 'instagram') {
                const result = await scrapeInstagram(hotWord, taskId);
                console.log(`\n✅ Task ${taskId} completed successfully`);
                console.log(`   Saved ${result.savedCount} posts`);

                await SearchTaskModel.findByIdAndUpdate(taskId, {
                    status: 'completed',
                    lastRunAt: new Date()
                });

                return result;
            } else {
                throw new Error(`Unsupported platform: ${platform}`);
            }

        } catch (err: any) {
            console.error(`\n❌ Task ${taskId} failed:`, err.message);
            await SearchTaskModel.findByIdAndUpdate(taskId, {
                status: 'failed'
            });
            throw err;
        }
    },
    {
        connection,
        concurrency: 5, // Обрабатываем до 5 задач параллельно
    }
);

// Worker для обновления метрик (периодическая проверка роста)
const metricsWorker = new Worker(
    'metrics_update_queue',
    async (job: Job) => {
        const { videoId } = job.data;
        console.log(`\n📊 Updating metrics for video: ${videoId}`);

        try {
            const result = await updatePostMetrics(videoId);

            if (result) {
                console.log(`✅ Metrics updated for ${videoId}`);
                return result;
            } else {
                console.log(`⚠️  Could not update metrics for ${videoId}`);
                return null;
            }

        } catch (err: any) {
            console.error(`❌ Metrics update failed for ${videoId}:`, err.message);
            throw err;
        }
    },
    {
        connection,
        concurrency: 3,
        limiter: {
            max: 10,
            duration: 60000
        }
    }
);

// Обработчики событий для search worker
searchWorker.on('completed', (job) => {
    console.log(`\n✨ Job ${job.id} (${job.name}) completed successfully`);
});

searchWorker.on('failed', (job, err) => {
    console.error(`\n💥 Job ${job?.id} (${job?.name}) failed:`, err.message);
});

searchWorker.on('progress', (job, progress) => {
    console.log(`⏳ Job ${job.id} progress: ${progress}%`);
});

// Обработчики событий для metrics worker
metricsWorker.on('completed', (job) => {
    console.log(`✅ Metrics job ${job.id} completed`);
});

metricsWorker.on('failed', (job, err) => {
    console.error(`❌ Metrics job ${job?.id} failed:`, err.message);
});

// Функция для автоматического добавления задач на обновление метрик
async function scheduleMetricsUpdates() {
    try {
        // Находим все viral посты, которые были обновлены более 6 часов назад
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        const viralPosts = await VideoModel.find({
            isViral: true,
            updatedAt: { $lt: sixHoursAgo }
        }).limit(50); // Обновляем максимум 50 постов за раз

        console.log(`\n🔄 Scheduling metrics updates for ${viralPosts.length} viral posts`);

        const { Queue } = await import('bullmq');
        const metricsQueue = new Queue('metrics_update_queue', { connection });

        for (const post of viralPosts) {
            await metricsQueue.add(
                'update_metrics',
                { videoId: post.videoId },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000
                    }
                }
            );
        }

        console.log(`✅ Scheduled ${viralPosts.length} metrics update jobs`);

    } catch (err: any) {
        console.error('❌ Error scheduling metrics updates:', err.message);
    }
}

// Запускаем автоматическое обновление метрик каждые 6 часов
setInterval(scheduleMetricsUpdates, 6 * 60 * 60 * 1000);

// Запускаем один раз при старте (через 1 минуту)
setTimeout(scheduleMetricsUpdates, 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n⚠️  SIGTERM received, closing workers...');
    await searchWorker.close();
    await metricsWorker.close();
    await connection.quit();
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n⚠️  SIGINT received, closing workers...');
    await searchWorker.close();
    await metricsWorker.close();
    await connection.quit();
    await mongoose.connection.close();
    process.exit(0);
});

console.log('\n🚀 Workers started successfully!');
console.log('   📡 Search queue: video_search_queue');
console.log('   📊 Metrics queue: metrics_update_queue');
console.log('\n⏳ Waiting for jobs...\n');