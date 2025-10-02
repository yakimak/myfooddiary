// app/utils/gigachat-debug.ts
import { gigaChatService } from './gigachat-api';

export async function debugGigaChat() {
  console.log('=== GigaChat Debug Information ===');
  
  // Проверка переменных окружения
  const authKey = process.env.EXPO_PUBLIC_GIGACHAT_AUTH_KEY;
  console.log('Environment check:');
  console.log('- EXPO_PUBLIC_GIGACHAT_AUTH_KEY present:', !!authKey);
  if (authKey) {
    console.log('- Key starts with "Bearer":', authKey.startsWith('Bearer '));
    console.log('- Key length:', authKey.length);
    // Не логируем сам ключ из соображений безопасности
  }

  // Проверка валидности ключа
  console.log('\nAuth key validation:');
  const validation = await gigaChatService.validateAuthKey();
  console.log('- Valid:', validation.valid);
  console.log('- Message:', validation.message);

  // Тестовый запрос
  console.log('\nTest request:');
  try {
    const testText = 'съел яблоко и выпил чай';
    console.log('- Test text:', testText);
    const result = await gigaChatService.parseFoodFromText(testText);
    console.log('- Success! Found products:', result);
  } catch (error: any) {
    console.log('- Error:', error.message);
  }

  console.log('=== End Debug ===');
}