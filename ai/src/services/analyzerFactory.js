import AIAnalyzer from './aiAnalyzer.js';
import GeminiAnalyzer from './geminiAnalyzer.js';

/**
 * Фабрика для создания нужного анализатора
 */
class AnalyzerFactory {
    static create(provider = null) {
        const selectedProvider = provider || process.env.AI_PROVIDER || 'gpt';

        switch (selectedProvider.toLowerCase()) {
            case 'gemini':
                console.log('🤖 Using Gemini 2.0 Flash');
                return new GeminiAnalyzer();

            case 'gpt':
            case 'openai':
                console.log('🤖 Using GPT-4o mini');
                return new AIAnalyzer();

            default:
                console.log('⚠️  Unknown provider, defaulting to GPT-4o mini');
                return new AIAnalyzer();
        }
    }

    static getAvailableProviders() {
        const providers = [];

        if (process.env.OPENAI_API_KEY) {
            providers.push('gpt');
        }

        if (process.env.GEMINI_API_KEY) {
            providers.push('gemini');
        }

        return providers;
    }
}

export default AnalyzerFactory;