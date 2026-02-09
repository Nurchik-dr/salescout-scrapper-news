import dotenv from "dotenv";
dotenv.config();
import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import {AnalysisTasksModel} from "./repositories/analyze-tasks.schema.js";
import downloadService from "./services/downloadService.js";
import {aiAnalysisQueue} from "./config/redis.js";

// Подключаем MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

connection.on('connect', () => console.log('✅ Connected to Redis'));
connection.on('error', (err) => console.error('❌ Redis connection error:', err));

const analysisWorker = new Worker(
    'analysis_tasks_queue',
    async (job) => {
        const { taskId, videoUrl } = job.data;
        console.log(`\n🎯 Processing task ${taskId}`);

        const startTime = Date.now();

        try {
            if (!videoUrl) {
                throw new Error('videoURL is required');
            }

            // Обновляем статус на "processing"
            await AnalysisTasksModel.findByIdAndUpdate(taskId, {
                status: 'parsing'
            });

            console.log(`Пошел процесс по обработке: ${videoUrl}`);
            // Шаг 1: Обработка видео (скачивание → анализ → очистка)
            console.log('Шаг 1: Установка и анализ...');
            const videoAnalysisStart = Date.now();

            const result = await downloadService.processVideo(videoUrl);

            if(!result.success){
                throw new Error('Не удалось сделать анализ видео');
            }

            const videoAnalysisTime = Date.now() - videoAnalysisStart;
            console.log(`Анализ видел завершился за ${videoAnalysisTime}ms`);

            console.log("hello world:", JSON.stringify({
                taskId,
                videoDescription: result.data
            }))

            await aiAnalysisQueue.add('scrape', {
                taskId,
                videoDescription: result.data
            }, {
                removeOnComplete: true
            })
        } catch (error) {
            const totalTime = Date.now() - startTime;
            console.error(`Ошибка за ${totalTime}ms:`, error.message);

            await AnalysisTasksModel.findByIdAndUpdate(taskId, {
                status: 'failed'
            });

            if (error.response) {
                console.error('Сервер OpenAi недоступен:', error.response.data);
                await AnalysisTasksModel.findByIdAndUpdate(taskId, {
                    status: 'failed'
                });
            }
        }

    },
    {
        connection,
        concurrency: 5
    }
);

analysisWorker.on('completed', (job) => {
    console.log(`\n✨ Job ${job.id} (${job.name}) completed successfully`);
});

analysisWorker.on('failed', (job, err) => {
    console.error(`\n💥 Job ${job?.id} (${job?.name}) failed:`, err.message);
});

analysisWorker.on('progress', (job, progress) => {
    console.log(`⏳ Job ${job.id} progress: ${progress}%`);
});

console.log('\n🚀 Workers started successfully!');
console.log('   📡 Search queue: video_search_queue');
console.log('\n⏳ Waiting for jobs...\n');


// const app = express();
// const PORT = process.env.PORT || 3000;
//
// // Middleware для работы с JSON
// app.use(express.json());
//
// // Routes
// app.use('/api', router);


// Запуск сервера
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
//     console.log(`AI Server URL: ${process.env.AI_SERVER_URL || 'http://localhost:5000'}`);
// });