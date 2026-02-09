/**
 * Повторяет запрос с экспоненциальной задержкой
 */
export async function retryWithBackoff(fn, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Проверяем, это ли rate limit ошибка
            if (error.message.includes('429') || error.message.includes('quota')) {
                const delay = Math.min(1000 * Math.pow(2, i), 40000); // max 40 сек
                console.log(`⏳ Rate limit hit, waiting ${delay/1000}s before retry ${i+1}/${maxRetries}...`);

                await sleep(delay);
                continue;
            }

            // Если это не rate limit, сразу выбрасываем ошибку
            throw error;
        }
    }

    throw lastError;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}