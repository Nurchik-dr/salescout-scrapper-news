import express from 'express';
import AnalyzerFactory from '../services/analyzerFactory.js';
import { validateVideoData } from '../utils/validator.js';

const router = express.Router();

/**
 * POST /api/analyze
 * Анализирует метрики видео
 */
router.post('/analyze', async (req, res) => {
    try {
        const videoData = req.body;
        let provider = req.query.provider || process.env.AI_PROVIDER || 'gpt';

        const validation = validateVideoData(videoData);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }

        console.log(`📊 Analyzing video: ${videoData.videoId} with ${provider} provider`);

        const analyzer = AnalyzerFactory.create(provider);

        const startTime = Date.now();
        const analysis = await analyzer.analyzeVideo(videoData);
        const analysisTime = Date.now() - startTime;

        console.log(`✅ Analysis completed in ${analysisTime}ms`);

        res.json({
            success: true,
            videoId: videoData.videoId,
            platform: videoData.platform,
            provider: provider,
            analyzedAt: new Date().toISOString(),
            analysisTime: `${analysisTime}ms`,
            analysis: analysis
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

/**
 * POST /api/analyze/batch
 * Анализирует несколько видео за раз
 */
router.post('/analyze/batch', async (req, res) => {
    try {
        const { videos, provider } = req.body;

        if (!Array.isArray(videos) || videos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Videos array is required'
            });
        }

        if (videos.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 10 videos per batch'
            });
        }

        console.log(`📊 Batch analyzing ${videos.length} videos with ${provider || 'default'} provider`);

        const analyzer = AnalyzerFactory.create(provider);

        const results = await Promise.all(
            videos.map(async (video) => {
                try {
                    const analysis = await analyzer.analyzeVideo(video);
                    return {
                        success: true,
                        videoId: video.videoId,
                        analysis
                    };
                } catch (error) {
                    return {
                        success: false,
                        videoId: video.videoId,
                        error: error.message
                    };
                }
            })
        );

        res.json({
            success: true,
            provider: provider || process.env.AI_PROVIDER || 'gpt',
            totalVideos: videos.length,
            analyzedAt: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('❌ Batch analysis error:', error);

        res.status(500).json({
            success: false,
            error: 'Batch analysis failed',
            message: error.message
        });
    }
});

/**
 * GET /api/providers
 * Показывает доступные AI провайдеры
 */
router.get('/providers', (req, res) => {
    const available = AnalyzerFactory.getAvailableProviders();
    const current = process.env.AI_PROVIDER || 'gpt';

    res.json({
        success: true,
        current: current,
        available: available,
        details: {
            gpt: {
                name: 'GPT-4o mini',
                provider: 'OpenAI',
                available: available.includes('gpt')
            },
            gemini: {
                name: 'Gemini 2.0 Flash',
                provider: 'Google',
                available: available.includes('gemini')
            }
        }
    });
});

export default router;