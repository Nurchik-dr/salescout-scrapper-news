import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import jpeg from 'jpeg-js';
import audioService from './audioService.js';

let model = null;

async function loadModel() {
    if (!model) {
        model = await cocoSsd.load();
    }
    return model;
}

function imageToTensor(imagePath) {
    const buf = fs.readFileSync(imagePath);
    const { data, width, height } = jpeg.decode(buf, { useTArray: true });

    // Убираем альфа-канал (RGBA -> RGB)
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
        rgb[j] = data[i];
        rgb[j + 1] = data[i + 1];
        rgb[j + 2] = data[i + 2];
    }

    return tf.tensor3d(rgb, [height, width, 3]);
}

/**
 * Рекурсивно удаляет директорию со всем содержимым
 */
function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                removeDirectory(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}

class DownloadService {
    /**
     * Полный процесс: скачивание → анализ → очистка
     */
    async processVideo(url) {
        let videoPath = null;
        let framesDir = null;
        let audioPath = null;

        try {
            console.log('[ProcessVideo] Starting download...');

            // Скачиваем видео
            const download = await this.download(url);
            videoPath = download.path;

            // Вычисляем пути для очистки сразу после скачивания
            // чтобы cleanup работал даже при ошибке в extractFrames
            const videoName = path.parse(videoPath).name;
            framesDir = path.resolve('tmp/frames', videoName);
            audioPath = path.resolve('tmp/audio', `${videoName}.mp3`);

            console.log('[ProcessVideo] Download complete, starting analysis...');

            // Анализируем
            const analysis = await this.extractFrames(videoPath);

            console.log('[ProcessVideo] Analysis complete, cleaning up...');

            // Удаляем временные файлы (видео, кадры и аудио)
            await this.cleanup(videoPath, framesDir, audioPath);

            console.log('[ProcessVideo] Cleanup complete!');

            // Убираем _raw из результата (файлы уже удалены)
            delete analysis._raw;

            return {
                success: true,
                data: analysis
            };

        } catch (error) {
            console.error('[ProcessVideo] Error:', error);

            // Пытаемся очистить файлы даже в случае ошибки
            try {
                await this.cleanup(videoPath, framesDir, audioPath);
            } catch (cleanupError) {
                console.error('[ProcessVideo] Cleanup error:', cleanupError);
            }

            throw error;
        }
    }

    /**
     * Очистка всех временных файлов
     */
    async cleanup(videoPath, framesDir, audioPath) {
        console.log("videoPath", videoPath)
        console.log("framesDir", framesDir)
        console.log("audioPath", audioPath)
        const errors = [];

        // Удаляем видео файл
        if (videoPath && fs.existsSync(videoPath)) {
            try {
                fs.unlinkSync(videoPath);
                console.log(`[Cleanup] Removed video: ${videoPath}`);
            } catch (err) {
                errors.push(`Failed to remove video: ${err.message}`);
            }
        }

        // Удаляем директорию с кадрами
        if (framesDir && fs.existsSync(framesDir)) {
            try {
                removeDirectory(framesDir);
                console.log(`[Cleanup] Removed frames directory: ${framesDir}`);
            } catch (err) {
                errors.push(`Failed to remove frames: ${err.message}`);
            }
        }

        // Удаляем аудио файл
        if (audioPath && fs.existsSync(audioPath)) {
            try {
                fs.unlinkSync(audioPath);
                console.log(`[Cleanup] Removed audio: ${audioPath}`);
            } catch (err) {
                errors.push(`Failed to remove audio: ${err.message}`);
            }
        }

        if (errors.length > 0) {
            console.warn('[Cleanup] Some files could not be removed:', errors);
        }
    }

    async download(url) {
        const tmpDir = path.resolve('tmp/videos');

        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const filename = `ig_${Date.now()}.mp4`;
        const filePath = path.join(tmpDir, filename);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok || !response.body) {
            throw new Error('Failed to download video');
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        return {
            status: 'downloaded',
            path: filePath,
            filename
        };
    }

    async extractFrames(videoPath) {
        const videoName = path.parse(videoPath).name;
        const framesDir = path.resolve('tmp/frames', videoName);
        const audioDir = path.resolve('tmp/audio');

        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir, { recursive: true });
        }
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        // Извлекаем кадры: 1 кадр в секунду
        const outputPattern = path.join(framesDir, 'frame_%03d.jpg');
        execSync(`ffmpeg -i "${videoPath}" -vf fps=1 "${outputPattern}" -y`, {
            stdio: 'pipe'
        });

        // Извлекаем аудио в mp3
        const audioPath = path.join(audioDir, `${videoName}.mp3`);
        execSync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}" -y`, {
            stdio: 'pipe'
        });

        const frames = fs.readdirSync(framesDir)
            .filter(f => f.endsWith('.jpg'))
            .sort();

        // Параллельно: детекция объектов + анализ аудио
        const [detections, audioAnalysis] = await Promise.all([
            this.detectObjects(frames.map(f => path.join(framesDir, f))),
            audioService.analyzeAudio(audioPath)
        ]);

        // Компактная классификация
        const timeline = this.buildCompactTimeline(frames, detections, audioAnalysis);

        return {
            status: 'extracted',
            duration: audioAnalysis.duration,
            audio: {
                type: audioAnalysis.type,
                description: audioAnalysis.description
            },
            timeline,
            // Оставляем пути для очистки
            _raw: {
                framesDir,
                audioPath,
                framesCount: frames.length
            }
        };
    }

    /**
     * Создаёт компактное описание временной шкалы видео
     */
    buildCompactTimeline(frames, detections, audioAnalysis) {
        // Группируем похожие кадры
        const timeline = [];

        detections.forEach((detection, index) => {
            const second = index; // т.к. 1 кадр в секунду

            // Извлекаем объекты с уверенностью > 50%
            const objects = detection.objects
                .filter(obj => obj.score > 50)
                .map(obj => obj.class);

            // Убираем дубликаты
            const uniqueObjects = [...new Set(objects)];

            // Описание кадра
            const frameDescription = this.describeFrame(uniqueObjects);

            timeline.push({
                second,
                visual: frameDescription
            });
        });

        // Группируем последовательные похожие кадры
        return this.groupSimilarFrames(timeline);
    }

    /**
     * Описывает содержимое кадра
     */
    describeFrame(objects) {
        if (objects.length === 0) {
            return 'Пустой кадр';
        }

        // Переводим на русский основные классы
        const translations = {
            'person': 'человек',
            'car': 'машина',
            'dog': 'собака',
            'cat': 'кошка',
            'bicycle': 'велосипед',
            'motorcycle': 'мотоцикл',
            'airplane': 'самолёт',
            'bus': 'автобус',
            'train': 'поезд',
            'truck': 'грузовик',
            'bird': 'птица',
            'horse': 'лошадь',
            'sheep': 'овца',
            'cow': 'корова',
            'bottle': 'бутылка',
            'wine glass': 'бокал',
            'cup': 'чашка',
            'fork': 'вилка',
            'knife': 'нож',
            'spoon': 'ложка',
            'bowl': 'миска',
            'banana': 'банан',
            'apple': 'яблоко',
            'chair': 'стул',
            'sofa': 'диван',
            'bed': 'кровать',
            'dining table': 'стол',
            'tv': 'телевизор',
            'laptop': 'ноутбук',
            'mouse': 'мышь',
            'keyboard': 'клавиатура',
            'cell phone': 'телефон',
            'book': 'книга',
            'clock': 'часы',
            'tie': 'галстук',
            'umbrella': 'зонт',
            'backpack': 'рюкзак',
            'handbag': 'сумка',
            'sports ball': 'мяч',
            'skateboard': 'скейтборд'
        };

        const translatedObjects = objects.map(obj => translations[obj] || obj);

        // Группируем одинаковые объекты
        const counts = {};
        translatedObjects.forEach(obj => {
            counts[obj] = (counts[obj] || 0) + 1;
        });

        const descriptions = Object.entries(counts).map(([obj, count]) => {
            if (count > 1) {
                return `${count} ${obj}${this.getPluralEnding(obj, count)}`;
            }
            return obj;
        });

        return descriptions.join(', ');
    }

    /**
     * Возвращает окончание для множественного числа
     */
    getPluralEnding(word, count) {
        // Специальные случаи
        if (word === 'человек') {
            if (count >= 2 && count <= 4) {
                return 'а';
            }
            return '';
        }

        // Общее правило для большинства слов
        if (count >= 2 && count <= 4) {
            return 'а';
        }

        return 'ов';
    }

    /**
     * Группирует похожие последовательные кадры
     */
    groupSimilarFrames(timeline) {
        if (timeline.length === 0) return [];

        const grouped = [];
        let currentGroup = {
            startSecond: timeline[0].second,
            endSecond: timeline[0].second,
            visual: timeline[0].visual,
            frameCount: 1
        };

        for (let i = 1; i < timeline.length; i++) {
            const current = timeline[i];

            // Если визуальное содержимое совпадает, объединяем
            if (current.visual === currentGroup.visual) {
                currentGroup.endSecond = current.second;
                currentGroup.frameCount++;
            } else {
                // Сохраняем предыдущую группу
                grouped.push(this.formatGroup(currentGroup));

                // Начинаем новую группу
                currentGroup = {
                    startSecond: current.second,
                    endSecond: current.second,
                    visual: current.visual,
                    frameCount: 1
                };
            }
        }

        // Добавляем последнюю группу
        grouped.push(this.formatGroup(currentGroup));

        return grouped;
    }

    /**
     * Форматирует группу кадров
     */
    formatGroup(group) {
        const duration = group.endSecond - group.startSecond + 1;

        return {
            timeRange: duration > 1
                ? `${group.startSecond}-${group.endSecond}с`
                : `${group.startSecond}с`,
            visual: group.visual,
            duration: `${duration}с`
        };
    }

    async detectObjects(framePaths) {
        console.log(`[ObjectDetection] Starting detection for ${framePaths.length} frames...`);
        const totalStart = Date.now();

        console.log('[ObjectDetection] Loading COCO-SSD model...');
        const model = await loadModel();
        console.log('[ObjectDetection] Model loaded');

        const results = [];

        for (let i = 0; i < framePaths.length; i++) {
            const framePath = framePaths[i];
            const tensor = imageToTensor(framePath);
            const predictions = await model.detect(tensor);
            tensor.dispose();

            results.push({
                frame: path.basename(framePath),
                objects: predictions.map(p => ({
                    class: p.class,
                    score: Math.round(p.score * 100)
                }))
            });

            if ((i + 1) % 5 === 0 || i === framePaths.length - 1) {
                console.log(`[ObjectDetection] Processed ${i + 1}/${framePaths.length} frames`);
            }
        }

        console.log(`[ObjectDetection] DONE in ${Date.now() - totalStart}ms`);
        return results;
    }
}

export default new DownloadService();