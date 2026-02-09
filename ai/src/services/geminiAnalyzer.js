import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000,
                responseMimeType: "application/json"
            }
        });
    }

    async analyzeVideo(videoData) {
        const prompt = this.buildPrompt(videoData);

        try {
            console.log('🤖 Sending request to Gemini...');

            const result = await this.model.generateContent(prompt);
            const response = await result.response;

            // Проверяем что ответ существует
            if (!response) {
                console.error('❌ No response from Gemini');
                return this.getFallbackResponse(videoData);
            }

            const text = response.text();
            console.log('📝 Raw Gemini response length:', text?.length || 0);

            // Проверяем что текст не пустой
            if (!text || text.trim().length === 0) {
                console.error('❌ Empty response from Gemini');
                return this.getFallbackResponse(videoData);
            }

            // Очищаем и парсим
            const cleaned = this.cleanJsonResponse(text);
            console.log('🧹 Cleaned response:', cleaned.substring(0, 200) + '...');

            const parsed = JSON.parse(cleaned);
            console.log('✅ Successfully parsed JSON');

            // Добавляем флаг что это AI ответ
            return {
                ...parsed,
                isAiGenerated: true,
                generatedBy: 'gemini'
            };

        } catch (error) {
            console.error('❌ Gemini API Error:', error.message);

            // Если это ошибка парсинга или пустой ответ - возвращаем fallback
            if (error.message.includes('JSON') ||
                error.message.includes('Unexpected end') ||
                error.message.includes('Empty response')) {
                console.log('⚠️  Using fallback response');
                return this.getFallbackResponse(videoData);
            }

            // Если quota error
            if (error.message.includes('quota') || error.message.includes('429')) {
                throw new Error('Gemini API quota exceeded. Please try again later or use GPT provider.');
            }

            // Если модель недоступна
            if (error.message.includes('404') || error.message.includes('not found')) {
                throw new Error('Gemini model not available. Please use GPT provider.');
            }

            throw new Error(`Gemini analysis failed: ${error.message}`);
        }
    }

    /**
     * Очищает JSON ответ
     */
    cleanJsonResponse(response) {
        let cleaned = response.trim();

        // Убираем markdown
        cleaned = cleaned.replace(/```json\n?/gi, '');
        cleaned = cleaned.replace(/```\n?/g, '');

        // Убираем невидимые символы
        cleaned = cleaned.replace(/^\uFEFF/, '');
        cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

        // Находим JSON объект
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        return cleaned;
    }

    /**
     * Возвращает базовую структуру если AI не справился
     */
    getFallbackResponse(videoData) {
        const engagementRate = this.calculateEngagement(videoData);
        const hashtags = this.extractHashtags(videoData.description);

        return {
            hook: {
                title: "🔥 Хук (первые 2–3 секунды)",
                text: this.generateHookText(videoData)
            },
            script: {
                title: "📜 Сценарий",
                steps: [
                    "Хук — обозначь проблему или интригу с первой секунды",
                    "Усиль эмоцию (покажи пример или расскажи историю)",
                    "Дай неожиданный инсайт или поворот",
                    "Предложи решение или вывод",
                    "Призыв к действию (лайк, подписка, комментарий)"
                ]
            },
            storyboard: {
                title: "🎬 Раскадровка",
                frames: [
                    "0–3с — крупный план, яркий визуал или текст с хуком",
                    "3–8с — смена ракурса, развитие темы",
                    "8–15с — основное объяснение или демонстрация",
                    "15–20с — финальный призыв к действию"
                ]
            },
            techTips: {
                title: "⚙️ Технические советы",
                tips: [
                    "Длительность: 15–25 секунд для максимального охвата",
                    "Вертикальный формат 9:16 (1080x1920)",
                    "Субтитры обязательны — 80% смотрят без звука",
                    "Быстрый темп монтажа (смена кадра каждые 2-3 секунды)",
                    `Используй трендовую музыку из библиотеки Instagram`,
                    "Качественное освещение — естественный свет или кольцевая лампа"
                ]
            },
            hashtags: {
                title: "🏷️ Хештеги",
                tags: hashtags.length > 0 ? hashtags : [
                    "#reels",
                    "#viral",
                    "#trending",
                    "#instagram",
                    "#explore",
                    "#рекомендации",
                    "#контент"
                ]
            },
            metrics: {
                title: "📊 Прогноз метрик",
                engagement: `${Math.max(5, parseFloat(engagementRate) - 2).toFixed(1)}% - ${(parseFloat(engagementRate) + 3).toFixed(1)}%`,
                views: `${Math.floor(videoData.views * 0.7).toLocaleString()} - ${Math.floor(videoData.views * 1.3).toLocaleString()}`,
                successProbability: this.getSuccessProbability(videoData.viralScore)
            },
            bestPostingTime: {
                title: "⏰ Лучшее время публикации",
                text: "18:00-21:00 по местному времени (пиковая активность аудитории)"
            },
            isAiGenerated: false,
            generatedBy: 'fallback'
        };
    }

    /**
     * Генерирует текст хука на основе контента
     */
    generateHookText(videoData) {
        const hooks = [
            "Смотри до конца — это изменит твой подход!",
            "Если ты когда-нибудь задумывался об этом — смотри!",
            "Вот что никто тебе не расскажет...",
            "То, что ты увидишь дальше, тебя удивит",
            "Секрет, который работает на 100%"
        ];

        // Если в описании есть ключевые слова, делаем более релевантный хук
        const desc = videoData.description.toLowerCase();

        if (desc.includes('мотивация') || desc.includes('успех')) {
            return "Если ты хочешь добиться успеха — смотри до конца";
        }
        if (desc.includes('спорт') || desc.includes('фитнес')) {
            return "Вот что изменит твою тренировку навсегда";
        }
        if (desc.includes('еда') || desc.includes('рецепт')) {
            return "Ты никогда не готовил это ТАК — смотри!";
        }

        // Возвращаем случайный хук
        return hooks[Math.floor(Math.random() * hooks.length)];
    }

    /**
     * Определяет вероятность успеха
     */
    getSuccessProbability(viralScore) {
        if (viralScore > 100) return "75-85%";
        if (viralScore > 70) return "60-75%";
        if (viralScore > 40) return "50-60%";
        return "40-50%";
    }

    /**
     * Извлекает хештеги из описания
     */
    extractHashtags(description) {
        const hashtags = description.match(/#[\wа-яА-ЯёЁ]+/g) || [];
        return hashtags.slice(0, 10); // максимум 10 хештегов
    }

    buildPrompt(data) {
        const engagementRate = this.calculateEngagement(data);
        const viralityLevel = this.getViralityLevel(data.viralScore);

        return `
Ты эксперт по анализу вирусного контента в Instagram Reels. Проанализируй метрики и создай детальный план создания похожего видео.

МЕТРИКИ ВИДЕО:
- Автор: ${data.author}
- Описание: "${data.description}"
- Просмотры: ${data.views.toLocaleString()}
- Лайки: ${data.likes.toLocaleString()}
- Комментарии: ${data.comments}
- Engagement Rate: ${engagementRate}%
- Viral Score: ${data.viralScore} (${viralityLevel})
- Опубликовано: ${new Date(data.publishedAt).toLocaleDateString()}
${data.isViral ? '- СТАТУС: ВИРУСНОЕ ВИДЕО ✅' : ''}

Создай подробный план в следующем JSON формате (ВСЁ НА РУССКОМ ЯЗЫКЕ):

{
  "hook": {
    "title": "🔥 Хук (первые 2–3 секунды)",
    "text": "конкретный текст или действие для хука"
  },
  "script": {
    "title": "📜 Сценарий",
    "steps": [
      "шаг 1 сценария",
      "шаг 2 сценария",
      "шаг 3 сценария",
      "шаг 4 сценария",
      "шаг 5 сценария"
    ]
  },
  "storyboard": {
    "title": "🎬 Раскадровка",
    "frames": [
      "0–3с — описание первого кадра",
      "3–8с — описание второго кадра",
      "8–15с — описание третьего кадра",
      "15–20с — описание финального кадра"
    ]
  },
  "techTips": {
    "title": "⚙️ Технические советы",
    "tips": [
      "совет 1",
      "совет 2",
      "совет 3",
      "совет 4"
    ]
  },
  "hashtags": {
    "title": "🏷️ Хештеги",
    "tags": ["#хештег1", "#хештег2", "#хештег3", "#хештег4", "#хештег5"]
  },
  "metrics": {
    "title": "📊 Прогноз метрик",
    "engagement": "ожидаемый процент вовлечения",
    "views": "прогноз просмотров",
    "successProbability": "вероятность успеха в процентах"
  },
  "bestPostingTime": {
    "title": "⏰ Лучшее время публикации",
    "text": "рекомендованное время"
  }
}

ВАЖНО: 
- Все тексты ТОЛЬКО на русском языке
- Будь конкретным и практичным
- Учитывай метрики оригинального видео
- Возвращай ТОЛЬКО валидный JSON без markdown

Верни ТОЛЬКО валидный JSON, никаких дополнительных текстов.
`;
    }

    calculateEngagement(data) {
        if (!data.views || data.views === 0) return 0;
        const engagement = ((data.likes + data.comments) / data.views) * 100;
        return engagement.toFixed(2);
    }

    getViralityLevel(score) {
        if (score >= 100) return 'ОЧЕНЬ ВЫСОКИЙ';
        if (score >= 70) return 'ВЫСОКИЙ';
        if (score >= 40) return 'СРЕДНИЙ';
        return 'НИЗКИЙ';
    }
}

export default GeminiAnalyzer;