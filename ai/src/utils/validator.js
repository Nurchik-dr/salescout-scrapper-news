/**
 * Валидирует данные видео
 */
export function validateVideoData(data) {
    console.log('data', data);
    const errors = [];

    // Обязательные поля
    if (!data.videoId) errors.push('videoId is required');
    if (!data.platform) errors.push('platform is required');
    if (!data.description) errors.push('description is required');
    // if (!data.video) errors.push('description is required');
    if (!data.videoData) errors.push('videoData is required');

    // Метрики
    if (typeof data.views !== 'number') errors.push('views must be a number');
    if (typeof data.likes !== 'number') errors.push('likes must be a number');
    if (typeof data.comments !== 'number') errors.push('comments must be a number');

    // Дополнительные проверки
    if (data.views < 0) errors.push('views cannot be negative');
    if (data.likes < 0) errors.push('likes cannot be negative');
    if (data.comments < 0) errors.push('comments cannot be negative');

    return {
        valid: errors.length === 0,
        errors
    };
}