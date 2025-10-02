import React, { createContext, ReactNode, useContext, useState } from 'react';
import type { ParsedProduct } from '../utils/gigachat-api';
import { hybridParser } from '../utils/hybrid-parser';

// -------------------- Типы --------------------
interface FoodItem {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface NoteItem {
  uid: string;
  productId: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Note {
  id: string;
  date: string;
  text: string;
  items: NoteItem[];
}

// -------------------- Моковая база продуктов (на 100 г) --------------------
export const FOOD_DB: FoodItem[] = [
  { id: "1", name: "Яблоко", kcal: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  { id: "2", name: "Куриная грудка (вареная)", kcal: 165, protein: 31, fat: 3.6, carbs: 0 },
  { id: "3", name: "Овсянка (сухая)", kcal: 380, protein: 13, fat: 7, carbs: 67 },
  { id: "4", name: "Рис белый (сухой)", kcal: 360, protein: 7, fat: 0.6, carbs: 80 },
  { id: "5", name: "Творог 5%", kcal: 145, protein: 17, fat: 5, carbs: 3 },
  { id: "6", name: "Банан", kcal: 89, protein: 1.1, fat: 0.3, carbs: 23 },
  { id: "7", name: "Авокадо", kcal: 160, protein: 2, fat: 15, carbs: 9 },
  { id: "8", name: "Яйцо куриное", kcal: 155, protein: 13, fat: 11, carbs: 1.1 },
  { id: "9", name: "Гречка (сухая)", kcal: 340, protein: 13, fat: 3.4, carbs: 72 },
  { id: "10", name: "Семга (запеч.)", kcal: 208, protein: 20, fat: 13, carbs: 0 },
  { id: "11", name: "Хлеб белый", kcal: 265, protein: 9, fat: 3, carbs: 49 },
  { id: "12", name: "Хлеб черный", kcal: 250, protein: 8, fat: 3, carbs: 45 },
  { id: "13", name: "Сыр", kcal: 350, protein: 25, fat: 28, carbs: 2 },
  { id: "14", name: "Молоко", kcal: 60, protein: 3, fat: 3, carbs: 5 },
  { id: "15", name: "Кофе", kcal: 2, protein: 0, fat: 0, carbs: 0 },
  { id: "16", name: "Сок апельсиновый", kcal: 45, protein: 0, fat: 0, carbs: 11 },
  { id: "17", name: "Печенье", kcal: 450, protein: 6, fat: 18, carbs: 65 },
  { id: "18", name: "Шоколад", kcal: 546, protein: 5, fat: 31, carbs: 61 },
  { id: "19", name: "Колбаса", kcal: 300, protein: 12, fat: 28, carbs: 1 },
  { id: "20", name: "Сосиски", kcal: 250, protein: 11, fat: 22, carbs: 2 },
];

// -------------------- Вспомогательные функции --------------------
export const todayKey = () => new Date().toISOString().slice(0, 10);

export const calcByGrams = (food: FoodItem, grams: number) => {
  const k = grams / 100;
  return {
    kcal: +(food.kcal * k).toFixed(1),
    protein: +(food.protein * k).toFixed(1),
    fat: +(food.fat * k).toFixed(1),
    carbs: +(food.carbs * k).toFixed(1),
  };
};

export const sumTotals = (items: NoteItem[]) =>
  items.reduce(
    (acc, i) => ({
      kcal: +(acc.kcal + i.kcal).toFixed(1),
      protein: +(acc.protein + i.protein).toFixed(1),
      fat: +(acc.fat + i.fat).toFixed(1),
      carbs: +(acc.carbs + i.carbs).toFixed(1),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  );

// -------------------- Глобальный контекст состояния --------------------
interface AppContextType {
  notesByDate: { [key: string]: Note[] };
  setNotesByDate: React.Dispatch<React.SetStateAction<{ [key: string]: Note[] }>>;
  goals: { kcal: number; protein: number; fat: number; carbs: number };
  setGoals: React.Dispatch<React.SetStateAction<{ kcal: number; protein: number; fat: number; carbs: number }>>;
  currentDate: string;
  setCurrentDate: React.Dispatch<React.SetStateAction<string>>;
  editingNoteId: string | null;
  setEditingNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  parseTextWithAI: (text: string) => Promise<ParsedProduct[]>;
  parseTextWithGigaChat: (text: string) => Promise<ParsedProduct[]>;
  isProcessingAI: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [notesByDate, setNotesByDate] = useState<{ [key: string]: Note[] }>({});
  const [goals, setGoals] = useState({
    kcal: 2000,
    protein: 130,
    fat: 70,
    carbs: 240,
  });
  const [currentDate, setCurrentDate] = useState(todayKey());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const parseTextWithAI = async (text: string): Promise<ParsedProduct[]> => {
    if (!text.trim()) return [];
    
    setIsProcessingAI(true);
    try {
      const products = await hybridParser.parseFoodFromText(text);
      return products;
    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    } finally {
      setIsProcessingAI(false);
    }
  };

  const parseTextWithGigaChat = async (text: string): Promise<ParsedProduct[]> => {
    if (!text.trim()) return [];
    
    setIsProcessingAI(true);
    try {
      const products = await hybridParser.parseWithGigaChat(text);
      return products;
    } catch (error) {
      console.error('GigaChat parse error:', error);
      throw error;
    } finally {
      setIsProcessingAI(false);
    }
  };

  const value = {
    notesByDate,
    setNotesByDate,
    goals,
    setGoals,
    currentDate,
    setCurrentDate,
    editingNoteId,
    setEditingNoteId,
    parseTextWithAI,
    parseTextWithGigaChat,
    isProcessingAI,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};