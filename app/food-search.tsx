import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { FOOD_DB, calcByGrams } from './context/AppContext';

const PurpleCard = ({ style, children, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    onPress={onPress}
    style={[styles.card, style]}
  >
    {children}
  </TouchableOpacity>
);

export default function FoodSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [grams, setGrams] = useState('100');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOOD_DB;
    return FOOD_DB.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  const openAdd = (item: any) => {
    setSelected(item);
    setGrams('100');
    setModalVisible(true);
  };

  const confirmAdd = () => {
    const g = Math.max(0, parseFloat(grams) || 0);
    const macros = calcByGrams(selected, g);
    const addedItem = {
      uid: Math.random().toString(36).slice(2),
      productId: selected.id,
      name: selected.name,
      grams: g,
      ...macros,
    };
    setModalVisible(false);
    // Возвращаемся на главный экран с параметром addedItem
    router.push({
      pathname: '/',
      params: { addedItem: JSON.stringify(addedItem) },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ padding: 16, flex: 1 }}>
        <Text style={styles.h1}>Поиск продуктов</Text>
        <TextInput
          placeholder="Введите название продукта"
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { marginTop: 10 }]}
        />
        <FlatList
          style={{ marginTop: 10 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <PurpleCard onPress={() => openAdd(item)}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.kcal} ккал / 100г</Text>
                </View>
              </View>
              <Text style={styles.muted}>
                Б {item.protein} • Ж {item.fat} • У {item.carbs} (на 100 г)
              </Text>
              <View style={[styles.rowBetween, { marginTop: 8 }]}>
                <View />
                <View style={styles.outlineBtn}>
                  <Ionicons name="add" color="#8A2BE2" size={16} />
                  <Text style={styles.outlineBtnText}>Добавить</Text>
                </View>
              </View>
            </PurpleCard>
          )}
        />

        {/* Модалка выбора граммов */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
            <View />
          </Pressable>
          <View style={styles.modalBox}>
            <Text style={styles.h2}>Сколько граммов?</Text>
            <Text style={{ color: "#3c3460", marginTop: 6 }}>
              {selected?.name} (ккал/100г: {selected?.kcal})
            </Text>
            <TextInput
              value={grams}
              onChangeText={setGrams}
              inputMode="numeric"
              keyboardType="numeric"
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Например, 150"
            />
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={confirmAdd}>
              <Text style={styles.primaryBtnText}>Добавить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 8, alignSelf: "center" }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#8A2BE2" }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
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
  cardTitle: { fontWeight: "700", color: "#2a214a", fontSize: 16 },
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
  pill: {
    backgroundColor: "#EFE7FB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: "#2a214a", fontWeight: "600", fontSize: 12 },
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
    top: "30%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E0F3",
  },
});