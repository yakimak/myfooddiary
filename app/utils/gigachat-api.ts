// app/utils/gigachat-api.ts
export interface ParsedProduct {
  name: string;
  grams: number;
  confidence: number;
}

class GigaChatService {
  private authKey: string;

  constructor() {
    this.authKey = process.env.EXPO_PUBLIC_GIGACHAT_AUTH_KEY || '';
    console.log('GigaChatService initialized. Auth key present:', !!this.authKey);
    
    if (!this.authKey) {
      console.warn('GigaChat auth key is missing. Add EXPO_PUBLIC_GIGACHAT_AUTH_KEY to .env');
    } else {
      console.log('Auth key format:', this.authKey.startsWith('Bearer ') ? 'Correct' : 'Incorrect - should start with "Bearer "');
    }
  }

  // Парсинг текста с помощью GigaChat
  async parseFoodFromText(text: string): Promise<ParsedProduct[]> {
    console.log('=== GigaChat API Call Started ===');
    console.log('Input text:', text);

    if (!this.authKey) {
      const error = 'GigaChat authorization key not configured. Add EXPO_PUBLIC_GIGACHAT_AUTH_KEY to .env';
      console.error(error);
      throw new Error(error);
    }

    if (!text.trim()) {
      console.log('Empty text provided');
      return [];
    }

    const prompt = this.buildPrompt(text);
    
    try {
      console.log('Sending request to GigaChat API...');
      
      const requestBody = {
        model: 'GigaChat',
        messages: [
          {
            role: 'system',
            content: 'Ты помогаешь определять продукты питания из текста на русском языке. Отвечаешь только в формате JSON. Игнорируй непищевые продукты.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': this.authKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GigaChat API error response:', errorText);
        
        let errorMessage = `GigaChat API error: ${response.status} ${response.statusText}`;
        
        if (response.status === 401) {
          errorMessage = 'Неверный ключ авторизации. Проверьте EXPO_PUBLIC_GIGACHAT_AUTH_KEY';
        } else if (response.status === 403) {
          errorMessage = 'Доступ запрещен. Проверьте права доступа ключа';
        } else if (response.status === 429) {
          errorMessage = 'Превышен лимит запросов';
        } else if (response.status >= 500) {
          errorMessage = 'Ошибка сервера GigaChat. Попробуйте позже';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('GigaChat API success response:', JSON.stringify(data, null, 2));

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response structure:', data);
        throw new Error('Неверная структура ответа от GigaChat');
      }

      const responseText = data.choices[0].message.content;
      console.log('Raw AI response:', responseText);

      // Очищаем ответ от возможных markdown блоков
      const cleanResponse = responseText.replace(/```json|```/g, '').trim();
      console.log('Cleaned response:', cleanResponse);

      try {
        const parsed = JSON.parse(cleanResponse);
        const products = parsed.products || [];
        
        console.log(`Parsed ${products.length} products:`, products);
        console.log('=== GigaChat API Call Completed Successfully ===');
        
        return products;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response that failed to parse:', cleanResponse);
        
        // Попробуем извлечь JSON даже если есть лишний текст
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            const products = parsed.products || [];
            console.log('Recovered products using regex:', products);
            return products;
          } catch (recoveryError) {
            console.error('JSON recovery also failed:', recoveryError);
          }
        }
        
        throw new Error('Неверный формат ответа от GigaChat. Ожидался JSON.');
      }

    } catch (error) {
      console.error('GigaChat API request failed:', error);
      
      if (error instanceof TypeError) {
        // Сетевые ошибки
        console.error('Network error - check internet connection');
        throw new Error('Проблемы с подключением к интернету. Проверьте сеть.');
      }
      
      throw error;
    }
  }

  private buildPrompt(text: string): string {
    return `
Пользователь написал: "${text}"

Проанализируй текст и определи все упомянутые продукты питания с приблизительным количеством в граммах.

ПРАВИЛА АНАЛИЗА:
1. Игнорируй непищевые продукты
2. Используй стандартные порции если количество не указано:
   - Фрукты/овощи: 150-200г
   - Мясо/рыба: 100-150г  
   - Крупы: 100-150г
   - Сладости: 40-100г
   - Напитки: 200-300мл
   - Кусок/штука: 100-150г
   - Порция: 150-200г
   - Бутерброд: 100-150г

3. Для комбинированных блюд указывай общий вес
4. Учитывай русские названия и склонения

ФОРМАТ ОТВЕТА - ТОЛЬКО JSON:
{
  "products": [
    {
      "name": "название_продукта",
      "grams": количество_грамм,
      "confidence": уверенность_от_0_до_1
    }
  ]
}

Примеры:
- "съел яблоко и банан" -> {"products": [{"name": "яблоко", "grams": 150, "confidence": 0.9}, {"name": "банан", "grams": 120, "confidence": 0.9}]}
- "выпил чай с сахаром" -> {"products": [{"name": "чай", "grams": 200, "confidence": 0.8}, {"name": "сахар", "grams": 10, "confidence": 0.7}]}
`;
  }

  // Проверка доступности API
  async checkAvailability(): Promise<boolean> {
    if (!this.authKey) {
      console.log('Availability check: no auth key');
      return false;
    }
    
    try {
      console.log('Testing GigaChat availability...');
      // Тестовый запрос с простым текстом
      const result = await this.parseFoodFromText('яблоко');
      console.log('Availability check result:', result.length > 0 ? 'Available' : 'No products found');
      return true;
    } catch (error) {
      console.error('Availability check failed:', error);
      return false;
    }
  }

  // Метод для проверки ключа
  async validateAuthKey(): Promise<{ valid: boolean; message: string }> {
    if (!this.authKey) {
      return { valid: false, message: 'Ключ не настроен' };
    }

    if (!this.authKey.startsWith('Bearer ')) {
      return { valid: false, message: 'Ключ должен начинаться с "Bearer "' };
    }

    try {
      await this.checkAvailability();
      return { valid: true, message: 'Ключ работает корректно' };
    } catch (error: any) {
      return { valid: false, message: error.message || 'Ошибка проверки ключа' };
    }
  }
}

export const gigaChatService = new GigaChatService();

// Для устранения предупреждения Expo Router
export default {};