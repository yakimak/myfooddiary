import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FOOD_DB, calcByGrams, sumTotals, todayKey, useApp } from './context/AppContext';
import type { ParsedProduct } from './utils/gigachat-api';

// Компоненты UI
const PurpleCard = ({ style, children, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    onPress={onPress}
    style={[styles.card, style]}
  >
    {children}
  </TouchableOpacity>
);

const ProgressBar = ({ value, goal, label }: any) => {
  const pct = Math.min(100, Math.round((value / (goal || 1)) * 100));
  return (
    <View style={{ marginVertical: 6 }}>
      <View style={styles.rowBetween}>
        <Text style={styles.muted}>{label}</Text>
        <Text style={styles.muted}>
          {value} / {goal}
        </Text>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
};

const Donut = ({ value, goal, size = 90, stroke = 10, label }: any) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, value / (goal || 1));
  const offset = circumference - circumference * progress;
  return (
    <View style={{ alignItems: "center", marginHorizontal: 10 }}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#D8BFD8"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <Circle
          stroke="#8A2BE2"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.donutText}>{label}</Text>
      <Text style={styles.donutValue}>
        {value} / {goal}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    notesByDate, 
    setNotesByDate, 
    goals, 
    currentDate, 
    setEditingNoteId, 
    editingNoteId, 
    setCurrentDate,
    parseTextWithAI,
    parseTextWithGigaChat,
    isProcessingAI
  } = useApp();

  const [text, setText] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [dateKey, setDateKey] = useState(currentDate);
  const [isAIParsing, setIsAIParsing] = useState(false);
  const [isGigaChatParsing, setIsGigaChatParsing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);

  // Если пришли из истории для редактирования — загрузим заметку
  useEffect(() => {
    if (editingNoteId) {
      const note = (notesByDate[currentDate] || []).find((n: any) => n.id === editingNoteId);
      if (note) {
        setText(note.text || "");
        setItems(note.items || []);
        setDateKey(note.date.slice(0, 10));
      }
    }
  }, [editingNoteId]);

  // Переход из поиска с добавленным продуктом
  useEffect(() => {
    if (params.addedItem) {
      try {
        const added = JSON.parse(params.addedItem as string);
        setItems((prev) => [...prev, added]);
        router.setParams({ addedItem: '' });
      } catch (error) {
        console.error('Error parsing addedItem:', error);
      }
    }
  }, [params.addedItem]);

  const totals = useMemo(() => sumTotals(items), [items]);

  const saveNote = () => {
    const dlist = notesByDate[dateKey] ? [...notesByDate[dateKey]] : [];
    const now = new Date();
    if (editingNoteId) {
      const idx = dlist.findIndex((n: any) => n.id === editingNoteId);
      if (idx !== -1) {
        dlist[idx] = { ...dlist[idx], text, items };
      }
    } else {
      dlist.unshift({
        id: Math.random().toString(36).slice(2),
        date: new Date().toISOString(),
        text,
        items,
      });
    }
    const next = { ...notesByDate, [dateKey]: dlist };
    setNotesByDate(next);
    setEditingNoteId(null);
    setCurrentDate(dateKey);
    setText("");
    setItems([]);
    Alert.alert("Сохранено", "Заметка добавлена в дневник.");
  };

  const removeItem = (uid: string) => setItems((prev) => prev.filter((i: any) => i.uid !== uid));

  // Функция для быстрого rule-based + GigaChat парсинга
  const parseWithAI = async () => {
    if (!text.trim()) {
      Alert.alert('Введите текст', 'Напишите что вы съели для анализа');
      return;
    }

    setIsAIParsing(true);
    try {
      const products = await parseTextWithAI(text);
      setParsedProducts(products);
      setShowAIModal(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось распознать продукты. Попробуйте еще раз.');
    } finally {
      setIsAIParsing(false);
    }
  };

  // Функция для принудительного использования GigaChat
  const parseWithGigaChat = async () => {
    if (!text.trim()) {
      Alert.alert('Введите текст', 'Напишите что вы съели для анализа');
      return;
    }

    setIsGigaChatParsing(true);
    try {
      const products = await parseTextWithGigaChat(text);
      setParsedProducts(products);
      setShowAIModal(true);
    } catch (error) {
      Alert.alert('Ошибка GigaChat', 'Не удалось распознать продукты через GigaChat. Проверьте API ключ.');
    } finally {
      setIsGigaChatParsing(false);
    }
  };

  // Функция для добавления распознанных продуктов
  const addParsedProducts = (products: ParsedProduct[]) => {
    const newItems = products.map(product => {
      // Ищем продукт в базе по названию
      const foundFood = FOOD_DB.find(food => 
        food.name.toLowerCase().includes(product.name.toLowerCase()) ||
        product.name.toLowerCase().includes(food.name.toLowerCase())
      );

      if (foundFood) {
        const macros = calcByGrams(foundFood, product.grams);
        return {
          uid: Math.random().toString(36).slice(2),
          productId: foundFood.id,
          name: foundFood.name,
          grams: product.grams,
          ...macros,
        };
      } else {
        // Если продукт не найден в базе, создаем базовую запись
        return {
          uid: Math.random().toString(36).slice(2),
          productId: 'unknown',
          name: product.name,
          grams: product.grams,
          kcal: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        };
      }
    });

    setItems(prev => [...prev, ...newItems]);
    setShowAIModal(false);
    setParsedProducts([]);
    Alert.alert('Успех', `Добавлено ${newItems.length} продуктов`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Сегодня</Text>

        <PurpleCard style={{ marginTop: 10 }}>
          <Text style={styles.muted}>Дата</Text>
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <TextInput
              value={dateKey}
              onChangeText={setDateKey}
              placeholder="ГГГГ-ММ-ДД"
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => setDateKey(todayKey())}
            >
              <Text style={styles.smallBtnText}>Сегодня</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.muted, { marginTop: 12 }]}>Заметка</Text>
          <TextInput
            style={[styles.input, { minHeight: 90 }]}
            placeholder='Пишите свободно: "Съел яблоко и курицу..."'
            multiline
            value={text}
            onChangeText={setText}
          />



          // В index.tsx добавьте эту кнопку временно
<TouchableOpacity 
  style={[styles.outlineBtn, { marginTop: 10 }]} 
  onPress={async () => {
    const { debugGigaChat } = await import('./utils/gigachat-debug');
    debugGigaChat();
  }}
>
  <Text style={styles.outlineBtnText}>Debug GigaChat</Text>
</TouchableOpacity>


          {/* Кнопки AI парсинга */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity 
              style={[styles.outlineBtn, isAIParsing && styles.disabledBtn, { flex: 1 }]} 
              onPress={parseWithAI}
              disabled={isAIParsing}
            >
              <Ionicons name="flash" color="#8A2BE2" size={16} />
              <Text style={styles.outlineBtnText}>
                {isAIParsing ? "Анализ..." : "Быстрый анализ"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryBtn, isGigaChatParsing && styles.disabledBtn, { flex: 1 }]} 
              onPress={parseWithGigaChat}
              disabled={isGigaChatParsing}
            >
              <Ionicons name="sparkles" color="white" size={16} />
              <Text style={styles.primaryBtnText}>
                {isGigaChatParsing ? "GigaChat..." : "GigaChat AI"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Блок выбранных продуктов */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Продукты (для автоподсчёта)</Text>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => router.push('/food-search')}
              >
                <Ionicons name="add" color="#8A2BE2" size={16} />
                <Text style={styles.outlineBtnText}>Добавить из базы</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <Text style={{ color: "#3c3460", marginTop: 6 }}>
                Пока пусто. Вы можете оставить только заметку — это необязательно.
              </Text>
            ) : (
              items.map((it: any) => (
                <View key={it.uid} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {it.name} — {it.grams} г
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Text style={styles.chips}>Б {it.protein}</Text>
                    <Text style={styles.chips}>Ж {it.fat}</Text>
                    <Text style={styles.chips}>У {it.carbs}</Text>
                    <Text style={styles.chips}>{it.kcal} ккал</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(it.uid)} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color="#8A2BE2" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={saveNote}>
            <Text style={styles.primaryBtnText}>{editingNoteId ? "Сохранить изменения" : "Сохранить заметку"}</Text>
          </TouchableOpacity>
        </PurpleCard>

        {/* Модалка с результатами AI */}
        <Modal visible={showAIModal} transparent animationType="slide">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAIModal(false)}>
            <View />
          </Pressable>
          <View style={styles.modalBox}>
            <Text style={styles.h2}>AI распознал продукты:</Text>
            
            {parsedProducts.length === 0 ? (
              <Text style={{ color: "#6b6292", marginTop: 10 }}>
                Не удалось распознать продукты 😔
              </Text>
            ) : (
              <>
                <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
                  {parsedProducts.map((product, index) => (
                    <View key={index} style={styles.aiProductItem}>
                      <Text style={styles.aiProductName}>{product.name}</Text>
                      <Text style={styles.aiProductGrams}>{product.grams} г</Text>
                      <Text style={styles.aiProductConfidence}>
                        Уверенность: {Math.round(product.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                
                <TouchableOpacity 
                  style={styles.primaryBtn}
                  onPress={() => addParsedProducts(parsedProducts)}
                >
                  <Text style={styles.primaryBtnText}>Добавить все продукты</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.outlineBtn}
                  onPress={() => setShowAIModal(false)}
                >
                  <Text style={styles.outlineBtnText}>Отмена</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>

        {/* Круговые индикаторы и прогресс-бары */}
        <Text style={[styles.h2, { marginTop: 16 }]}>Прогресс дня</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 8 }}>
          <Donut label="Калории" value={totals.kcal} goal={goals.kcal} />
          <Donut label="Белки" value={totals.protein} goal={goals.protein} />
          <Donut label="Жиры" value={totals.fat} goal={goals.fat} />
          <Donut label="Углеводы" value={totals.carbs} goal={goals.carbs} />
        </View>

        <PurpleCard style={{ marginTop: 12 }}>
          <ProgressBar label="Калории" value={totals.kcal} goal={goals.kcal} />
          <ProgressBar label="Белки" value={totals.protein} goal={goals.protein} />
          <ProgressBar label="Жиры" value={totals.fat} goal={goals.fat} />
          <ProgressBar label="Углеводы" value={totals.carbs} goal={goals.carbs} />
        </PurpleCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F2FA" },
  h1: { fontSize: 26, fontWeight: "700", color: "#2a214a" },
  h2: { fontSize: 18, fontWeight: "700", color: "#2a214a" },
  muted: { color: "#6b6292" },
  card: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E0F3",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D8BFD8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#2a214a",
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "700" },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#8A2BE2",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  outlineBtnText: { color: "#8A2BE2", fontWeight: "600" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  smallBtn: {
    backgroundColor: "#9370DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallBtnText: { color: "white", fontWeight: "700" },
  itemRow: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE6F7",
    backgroundColor: "#FBF9FF",
  },
  itemText: { color: "#2a214a", fontWeight: "600", marginBottom: 6 },
  chips: {
    backgroundColor: "#EFE7FB",
    color: "#2a214a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressWrap: {
    height: 10,
    backgroundColor: "#EFE7FB",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8A2BE2",
  },
  donutText: { color: "#6b6292", fontSize: 12, marginTop: 2 },
  donutValue: { color: "#2a214a", fontWeight: "700", fontSize: 12 },
  modalBackdrop: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.25)",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalBox: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "20%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E0F3",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  aiProductItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0F3',
  },
  aiProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a214a',
  },
  aiProductGrams: {
    color: '#6b6292',
    marginTop: 2,
  },
  aiProductConfidence: {
    color: '#9370DB',
    fontSize: 12,
    marginTop: 2,
  },
});
