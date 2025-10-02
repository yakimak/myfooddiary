import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from './context/AppContext';

const PurpleCard = ({ style, children, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    onPress={onPress}
    style={[styles.card, style]}
  >
    {children}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { goals, setGoals } = useApp();
  const [local, setLocal] = useState(goals);

  useEffect(() => setLocal(goals), [goals]);

  const update = (key: string, val: string) => {
    setLocal((s) => ({ ...s, [key]: Math.max(0, parseInt(val || "0", 10)) }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Профиль и цели</Text>
        <PurpleCard style={{ marginTop: 10 }}>
          <Text style={styles.muted}>Дневные цели</Text>
          <TextInput
            value={String(local.kcal)}
            onChangeText={(v) => update("kcal", v)}
            inputMode="numeric"
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Калории"
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <TextInput
              value={String(local.protein)}
              onChangeText={(v) => update("protein", v)}
              inputMode="numeric"
              style={[styles.input, { flex: 1 }]}
              placeholder="Белки (г)"
            />
            <TextInput
              value={String(local.fat)}
              onChangeText={(v) => update("fat", v)}
              inputMode="numeric"
              style={[styles.input, { flex: 1 }]}
              placeholder="Жиры (г)"
            />
            <TextInput
              value={String(local.carbs)}
              onChangeText={(v) => update("carbs", v)}
              inputMode="numeric"
              style={[styles.input, { flex: 1 }]}
              placeholder="Углеводы (г)"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 12 }]}
            onPress={() => {
              setGoals(local);
              Alert.alert("Готово", "Цели обновлены.");
            }}
          >
            <Text style={styles.primaryBtnText}>Сохранить цели</Text>
          </TouchableOpacity>
        </PurpleCard>

        <PurpleCard style={{ marginTop: 12 }}>
          <Text style={styles.muted}>
            Приложение вдохновлено FatSecret, но использует упрощённый ввод: вы можете вести свободные заметки и при желании добавлять продукты из базы для точного подсчёта БЖУ и калорий.
          </Text>
        </PurpleCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F2FA" },
  h1: { fontSize: 26, fontWeight: "700", color: "#2a214a" },
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
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "700" },
});