// app/utils/hybrid-parser.ts
import { ParsedProduct, gigaChatService } from './gigachat-api';

export class HybridFoodParser {
  private useGigaChatParser: boolean;

  constructor() {
    this.useGigaChatParser = !!(process.env.EXPO_PUBLIC_GIGACHAT_CLIENT_ID && 
                               process.env.EXPO_PUBLIC_GIGACHAT_CLIENT_SECRET);
  }

  async parseFoodFromText(text: string): Promise<ParsedProduct[]> {
    if (!text.trim()) return [];
    
    // Если нет настроек GigaChat, возвращаем пустой массив
    if (!this.useGigaChatParser) {
      console.log('GigaChat не настроен');
      return [];
    }

    try {
      console.log('Используем GigaChat API...');
      const products = await gigaChatService.parseFoodFromText(text);
      
      // Фильтруем результаты с низкой уверенностью
      const confidentResults = products.filter(product => product.confidence > 0.3);
      console.log('GigaChat нашел продуктов:', confidentResults.length);
      
      return confidentResults;
    } catch (error) {
      console.log('GigaChat API недоступен, возвращаем пустой результат');
      return [];
    }
  }

  // Метод для принудительного использования GigaChat
  async parseWithGigaChat(text: string): Promise<ParsedProduct[]> {
    if (!this.useGigaChatParser) {
      throw new Error('GigaChat парсер не настроен. Добавьте GigaChat client_id и client_secret в .env');
    }

    try {
      const results = await gigaChatService.parseFoodFromText(text);
      return results.filter(product => product.confidence > 0.3);
    } catch (error) {
      console.error('GigaChat API error:', error);
      throw new Error('Ошибка при распознавании продуктов через GigaChat');
    }
  }

  // Проверка доступности GigaChat
  async checkGigaChatAvailability(): Promise<boolean> {
    return this.useGigaChatParser ? await gigaChatService.checkAvailability() : false;
  }
}

export const hybridParser = new HybridFoodParser();

// Реэкспортируем ParsedProduct для использования в других файлах
export type { ParsedProduct } from './gigachat-api';

