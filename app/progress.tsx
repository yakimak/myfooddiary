import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { sumTotals, todayKey, useApp } from './context/AppContext';

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

export default function ProgressScreen() {
  const { notesByDate, goals } = useApp();
  const [dateKey, setDateKey] = useState(todayKey());

  const totals = useMemo(() => {
    const dayNotes = notesByDate[dateKey] || [];
    const dayItems = dayNotes.flatMap((n: any) => n.items || []);
    return sumTotals(dayItems);
  }, [notesByDate, dateKey]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Прогресс</Text>
        <Text style={styles.muted}>Дата</Text>
        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <TextInput value={dateKey} onChangeText={setDateKey} placeholder="ГГГГ-ММ-ДД" style={styles.input} />
          <TouchableOpacity style={styles.smallBtn} onPress={() => setDateKey(todayKey())}>
            <Text style={styles.smallBtnText}>Сегодня</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
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
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  smallBtn: {
    backgroundColor: "#9370DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallBtnText: { color: "white", fontWeight: "700" },
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
});