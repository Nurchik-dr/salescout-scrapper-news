import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import downloadService from '../services/downloadService.js';
import audioService from '../services/audioService.js';
import axios from 'axios';

const router = express.Router();

// Redis connection для очереди
const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

// Очередь для задач анализа

async function sendToAIServer(data) {
        try {
            const response = await axios.post(process.env.AI_SERVER_URL + '/api/analyze', data);
            return response.data;
        } catch (error) {
            console.log('error', error.message);
        }
}

router.post('/analyze', async (req, res) => {
    const startTime = Date.now();

    try {
        const data = req.body;

        // Валидация
        if (!data.videoURL) {
            return res.status(400).json({
                success: false,
                error: 'videoURL is required'
            });
        }

        console.log(`[API] Processing video from: ${data.videoURL}`);

        // Шаг 1: Обработка видео (скачивание → анализ → очистка)
        console.log('[API] Step 1: Downloading and analyzing video...');
        const videoAnalysisStart = Date.now();

        const result = await downloadService.processVideo(data.videoURL);

        const videoAnalysisTime = Date.now() - videoAnalysisStart;
        console.log(`[API] Video analysis completed in ${videoAnalysisTime}ms`);

        // Шаг 2: Подготовка данных для AI сервера
        const aiRequestData = {
            ...data,
            videoData: result
        };
        console.log('result', result)

        console.log('[API] Step 2: Sending to AI server...');
        console.log('[API] Request data:', {
            ...data,
            videoData: {
                status: result.data?.status,
                duration: result.data?.duration,
                timelineLength: result.data?.timeline?.length
            }
        });

        // Шаг 3: Отправка на AI сервер с retry
        const aiServerStart = Date.now();

        const aiResponse = await sendToAIServer(aiRequestData);

        const aiServerTime = Date.now() - aiServerStart;
        console.log(`[API] AI server responded in ${aiServerTime}ms`);

        // Шаг 4: Возврат результата клиенту
        const totalTime = Date.now() - startTime;
        console.log(`[API] Total processing time: ${totalTime}ms`);

        // Добавляем метрики в ответ (опционально)
        res.json({
            ...aiResponse,
            _metrics: {
                videoAnalysisTime: `${videoAnalysisTime}ms`,
                aiServerTime: `${aiServerTime}ms`,
                totalTime: `${totalTime}ms`
            }
        });

    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[API] Error after ${totalTime}ms:`, error.message);

        // Различаем типы ошибок
        if (error.code === 'ECONNREFUSED') {
            // AI сервер недоступен
            return res.status(503).json({
                success: false,
                error: 'AI server is unavailable',
                message: 'The AI analysis service is temporarily unavailable. Please try again later.'
            });
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            // Таймаут
            return res.status(504).json({
                success: false,
                error: 'AI server timeout',
                message: 'The AI analysis took too long. Please try again with a shorter video.'
            });
        }

        if (error.response) {
            // Ошибка от AI сервера
            console.error('[API] AI server error:', error.response.data);
            return res.status(error.response.status).json({
                success: false,
                error: error.response.data.error || 'AI server error',
                details: error.response.data
            });
        }

        // Локальная ошибка (скачивание/анализ)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process video',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/download', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        const result = await downloadService.download(url);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/extract-frames', async (req, res) => {
    try {
        const { videoPath } = req.body;

        if (!videoPath) {
            return res.status(400).json({
                success: false,
                error: 'videoPath is required'
            });
        }

        const result = await downloadService.extractFrames(videoPath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/analyze-audio', async (req, res) => {
    try {
        const { audioPath } = req.body;

        if (!audioPath) {
            return res.status(400).json({
                success: false,
                error: 'audioPath is required'
            });
        }

        const result = await audioService.analyzeAudio(audioPath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/detect-speech', async (req, res) => {
    try {
        const { audioPath } = req.body;

        if (!audioPath) {
            return res.status(400).json({
                success: false,
                error: 'audioPath is required'
            });
        }

        const result = await audioService.detectVoiceActivity(audioPath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/transcribe', async (req, res) => {
    try {
        const { audioPath } = req.body;

        if (!audioPath) {
            return res.status(400).json({
                success: false,
                error: 'audioPath is required'
            });
        }

        const result = await audioService.transcribeSpeech(audioPath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/classify-audio', async (req, res) => {
    try {
        const { audioPath } = req.body;

        if (!audioPath) {
            return res.status(400).json({
                success: false,
                error: 'audioPath is required'
            });
        }

        const result = await audioService.classifyAudio(audioPath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default router;
