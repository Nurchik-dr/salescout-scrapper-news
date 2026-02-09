import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { pipeline, env } from '@xenova/transformers';
import pkg from 'wavefile';
const { WaveFile } = pkg;

// Настройка transformers.js для локального использования
env.useBrowserCache = false;
env.allowLocalModels = true;

// Кэш для моделей
let whisperPipeline = null;
let audioClassifierPipeline = null;

/**
 * Конвертирует аудио в WAV 16kHz mono для обработки
 */
function convertToWav(inputPath, outputPath) {
    execSync(
        `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`,
        { stdio: 'pipe' }
    );
    return outputPath;
}

/**
 * Читает WAV файл и возвращает Float32Array сэмплов
 */
function readWavAsFloat32(wavPath) {
    const buffer = fs.readFileSync(wavPath);
    const wav = new WaveFile(buffer);
    wav.toBitDepth('32f');
    const samples = wav.getSamples();

    // Если стерео - берём первый канал
    if (Array.isArray(samples)) {
        return new Float32Array(samples[0]);
    }

    return new Float32Array(samples);
}

/**
 * Инициализация Whisper
 */
async function getWhisper() {
    if (!whisperPipeline) {
        console.log('Loading Whisper model (whisper-tiny)...');
        whisperPipeline = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny'
        );
        console.log('Whisper loaded');
    }
    return whisperPipeline;
}

/**
 * Инициализация Audio Classifier
 */
async function getAudioClassifier() {
    if (!audioClassifierPipeline) {
        console.log('Loading Audio Classification model...');
        audioClassifierPipeline = await pipeline(
            'audio-classification',
            'Xenova/ast-finetuned-audioset-10-10-0.4593'
        );
        console.log('Audio Classifier loaded');
    }
    return audioClassifierPipeline;
}

class AudioService {
    /**
     * Полный анализ аудио: VAD + Whisper + Audio Classification
     * УЛУЧШЕННАЯ ВЕРСИЯ - возвращает компактный результат
     */
    async analyzeAudio(audioPath) {
        console.log('[AudioService] Starting full analysis...');
        const totalStart = Date.now();

        const audioDir = path.dirname(audioPath);
        const audioName = path.parse(audioPath).name;
        const wavPath = path.join(audioDir, `${audioName}_16k.wav`);

        // Конвертируем в WAV 16kHz
        console.log('[AudioService] Converting audio to WAV 16kHz...');
        convertToWav(audioPath, wavPath);

        // Параллельно запускаем все анализы
        console.log('[AudioService] Starting parallel analysis...');
        const [vadResult, transcription, classification] = await Promise.all([
            this.detectVoiceActivity(wavPath),
            this.transcribeSpeech(wavPath),
            this.classifyAudio(wavPath)
        ]);

        console.log('[AudioService] All analyses complete, cleaning up...');

        // Удаляем временный WAV файл
        fs.unlinkSync(wavPath);

        console.log(`[AudioService] DONE in ${Date.now() - totalStart}ms`);

        // НОВОЕ: Возвращаем компактный результат
        return this.buildCompactResult(vadResult, transcription, classification);
    }

    /**
     * НОВЫЙ МЕТОД: Создаёт компактное описание аудио
     */
    buildCompactResult(vad, transcription, classification) {
        const primaryType = this.determinePrimaryType(vad, classification);
        const description = this.buildAudioDescription(primaryType, transcription, classification);

        return {
            // Основная информация
            type: primaryType,
            description: description,
            duration: vad.audioDuration,

            // Минимальная VAD информация
            hasSpeech: vad.hasSpeech,
            speechPercentage: vad.speechPercentage,

            // Транскрипция (если есть речь)
            ...(vad.hasSpeech && transcription.text && {
                transcription: transcription.text
            }),

            // Топ-3 категории (только релевантные, score > 5)
            topCategories: this.getTopCategories(classification)
        };
    }

    /**
     * Определяет основной тип аудио
     */
    determinePrimaryType(vad, classification) {
        // Если есть речь и она занимает > 30% времени
        if (vad.hasSpeech && vad.speechPercentage > 30) {
            return 'speech';
        }

        // Иначе смотрим на классификацию
        const { primaryType, topPrediction } = classification;

        if (topPrediction.score > 50) {
            // Упрощаем названия
            if (primaryType === 'speech') return 'speech';
            if (primaryType === 'music') return 'music';
            if (primaryType === 'environment_sound') return 'environment';
        }

        return 'unknown';
    }

    /**
     * Создаёт человекочитаемое описание аудио
     */
    buildAudioDescription(primaryType, transcription, classification) {
        if (primaryType === 'speech') {
            // Если есть транскрипция, показываем её
            if (transcription.text && transcription.text !== '[музыка]' && transcription.text.length > 0) {
                return `Речь: ${transcription.text}`;
            }
            return 'Речь';
        }

        if (primaryType === 'music') {
            // Ищем подтипы музыки
            const musicGenres = classification.categories.music
                .filter(cat => cat.score > 5 && cat.label.toLowerCase() !== 'music')
                .slice(0, 2) // Топ-2 жанра
                .map(cat => cat.label);

            if (musicGenres.length > 0) {
                return `Музыка: ${musicGenres.join(', ')}`;
            }
            return 'Музыка';
        }

        if (primaryType === 'environment') {
            // Показываем главный звук окружения
            const topEnv = classification.categories.environment[0];
            if (topEnv) {
                return `Звуки: ${topEnv.label}`;
            }
            return 'Звуки окружения';
        }

        return 'Без звука';
    }

    /**
     * Возвращает только релевантные категории (score > 5)
     */
    getTopCategories(classification) {
        const result = [];

        // Собираем все категории в один массив
        const allCategories = [
            ...classification.categories.speech,
            ...classification.categories.music,
            ...classification.categories.environment
        ];

        // Фильтруем и сортируем
        return allCategories
            .filter(cat => cat.score > 5) // Только релевантные
            .sort((a, b) => b.score - a.score) // Сортируем по score
            .slice(0, 3) // Топ-3
            .map(cat => ({
                label: cat.label,
                score: cat.score
            }));
    }

    /**
     * VAD - определение сегментов с речью (на основе энергии сигнала)
     * Быстрая реализация без внешних зависимостей
     */
    async detectVoiceActivity(audioPath) {
        console.log('[VAD] Starting...');
        const startTime = Date.now();

        // Конвертируем в WAV если нужно
        let wavPath = audioPath;
        let needsCleanup = false;

        if (!audioPath.endsWith('.wav')) {
            const audioDir = path.dirname(audioPath);
            const audioName = path.parse(audioPath).name;
            wavPath = path.join(audioDir, `${audioName}_vad_16k.wav`);
            convertToWav(audioPath, wavPath);
            needsCleanup = true;
        }

        const audioData = readWavAsFloat32(wavPath);

        if (needsCleanup) {
            fs.unlinkSync(wavPath);
        }

        const SAMPLE_RATE = 16000;
        const FRAME_SIZE = 1600; // 100ms фреймы (быстрее)
        const FRAME_DURATION = FRAME_SIZE / SAMPLE_RATE;

        // Вычисляем энергию каждого фрейма
        const energies = [];
        for (let i = 0; i < audioData.length; i += FRAME_SIZE) {
            const frame = audioData.slice(i, i + FRAME_SIZE);
            let energy = 0;
            for (let j = 0; j < frame.length; j++) {
                energy += frame[j] * frame[j];
            }
            energies.push(Math.sqrt(energy / frame.length));
        }

        // Определяем порог (адаптивный)
        const sortedEnergies = [...energies].sort((a, b) => a - b);
        const noiseFloor = sortedEnergies[Math.floor(sortedEnergies.length * 0.1)] || 0;
        const threshold = Math.max(noiseFloor * 3, 0.01);

        // Находим сегменты с речью
        const segments = [];
        let currentSegment = null;

        for (let i = 0; i < energies.length; i++) {
            const isSpeech = energies[i] > threshold;
            const currentTime = i * FRAME_DURATION;

            if (isSpeech && !currentSegment) {
                currentSegment = { start: currentTime };
            } else if (!isSpeech && currentSegment) {
                currentSegment.end = currentTime;
                currentSegment.duration = Math.round((currentSegment.end - currentSegment.start) * 1000) / 1000;
                currentSegment.start = Math.round(currentSegment.start * 1000) / 1000;
                currentSegment.end = Math.round(currentSegment.end * 1000) / 1000;
                if (currentSegment.duration >= 0.2) { // Минимум 200ms
                    segments.push(currentSegment);
                }
                currentSegment = null;
            }
        }

        // Закрываем последний сегмент
        if (currentSegment) {
            currentSegment.end = energies.length * FRAME_DURATION;
            currentSegment.duration = Math.round((currentSegment.end - currentSegment.start) * 1000) / 1000;
            currentSegment.start = Math.round(currentSegment.start * 1000) / 1000;
            currentSegment.end = Math.round(currentSegment.end * 1000) / 1000;
            if (currentSegment.duration >= 0.2) {
                segments.push(currentSegment);
            }
        }

        const totalSpeechDuration = segments.reduce((sum, s) => sum + s.duration, 0);
        const audioDuration = audioData.length / SAMPLE_RATE;

        console.log(`[VAD] Done in ${Date.now() - startTime}ms`);

        return {
            hasSpeech: segments.length > 0,
            segmentsCount: segments.length,
            totalSpeechDuration: Math.round(totalSpeechDuration * 100) / 100,
            audioDuration: Math.round(audioDuration * 100) / 100,
            speechPercentage: Math.round((totalSpeechDuration / audioDuration) * 100),
            segments
        };
    }

    /**
     * Whisper - распознавание речи
     */
    async transcribeSpeech(audioPath) {
        // Конвертируем в WAV если нужно
        let wavPath = audioPath;
        let needsCleanup = false;

        if (!audioPath.endsWith('.wav')) {
            const audioDir = path.dirname(audioPath);
            const audioName = path.parse(audioPath).name;
            wavPath = path.join(audioDir, `${audioName}_whisper_16k.wav`);
            convertToWav(audioPath, wavPath);
            needsCleanup = true;
        }

        console.log('[Whisper] Getting model...');
        const whisper = await getWhisper();

        console.log('[Whisper] Reading audio file...');
        const audioData = readWavAsFloat32(wavPath);
        console.log(`[Whisper] Audio length: ${audioData.length} samples (${(audioData.length / 16000).toFixed(1)}s)`);

        if (needsCleanup) {
            fs.unlinkSync(wavPath);
        }

        console.log('[Whisper] Starting transcription...');
        const startTime = Date.now();

        const result = await whisper(audioData, {
            sampling_rate: 16000,
            return_timestamps: true,
            language: 'russian',
            task: 'transcribe'
        });

        console.log(`[Whisper] Transcription done in ${Date.now() - startTime}ms`);

        return {
            text: result.text.trim(),
            chunks: result.chunks?.map(chunk => ({
                text: chunk.text,
                start: chunk.timestamp[0],
                end: chunk.timestamp[1]
            })) || []
        };
    }

    /**
     * Audio Classification - классификация звуков/шумов
     */
    async classifyAudio(audioPath) {
        // Конвертируем в WAV если нужно
        let wavPath = audioPath;
        let needsCleanup = false;

        if (!audioPath.endsWith('.wav')) {
            const audioDir = path.dirname(audioPath);
            const audioName = path.parse(audioPath).name;
            wavPath = path.join(audioDir, `${audioName}_classify_16k.wav`);
            convertToWav(audioPath, wavPath);
            needsCleanup = true;
        }

        console.log('[Classifier] Getting model...');
        const classifier = await getAudioClassifier();

        console.log('[Classifier] Reading audio...');
        const audioData = readWavAsFloat32(wavPath);

        if (needsCleanup) {
            fs.unlinkSync(wavPath);
        }

        console.log('[Classifier] Starting classification...');
        const startTime = Date.now();

        const results = await classifier(audioData, {
            sampling_rate: 16000,
            top_k: 10
        });

        console.log(`[Classifier] Done in ${Date.now() - startTime}ms`);

        // Группируем по категориям
        const categories = {
            speech: [],
            music: [],
            environment: [],
            other: []
        };

        const speechLabels = ['speech', 'male speech', 'female speech', 'child speech', 'conversation', 'narration'];
        const musicLabels = ['music', 'musical instrument', 'singing', 'song', 'guitar', 'piano', 'drum'];

        for (const item of results) {
            const label = item.label.toLowerCase();
            const entry = {
                label: item.label,
                score: Math.round(item.score * 100)
            };

            if (speechLabels.some(s => label.includes(s))) {
                categories.speech.push(entry);
            } else if (musicLabels.some(m => label.includes(m))) {
                categories.music.push(entry);
            } else if (item.score > 0.1) {
                categories.environment.push(entry);
            } else {
                categories.other.push(entry);
            }
        }

        // Определяем основной тип аудио
        const topResult = results[0];
        let primaryType = 'unknown';
        if (categories.speech.length > 0 && categories.speech[0].score > 20) {
            primaryType = 'speech';
        } else if (categories.music.length > 0 && categories.music[0].score > 20) {
            primaryType = 'music';
        } else if (categories.environment.length > 0) {
            primaryType = 'environment_sound';
        }

        return {
            primaryType,
            topPrediction: {
                label: topResult.label,
                score: Math.round(topResult.score * 100)
            },
            categories,
            allPredictions: results.map(r => ({
                label: r.label,
                score: Math.round(r.score * 100)
            }))
        };
    }
}

export default new AudioService();