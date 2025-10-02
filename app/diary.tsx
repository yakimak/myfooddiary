import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { sumTotals, useApp } from './context/AppContext';

const PurpleCard = ({ style, children, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    onPress={onPress}
    style={[styles.card, style]}
  >
    {children}
  </TouchableOpacity>
);

const NoteCard = ({ note, onEdit, onDelete }: any) => {
  const totals = sumTotals(note.items || []);
  return (
    <PurpleCard style={{ marginBottom: 10 }} onPress={onEdit}>
      <Text style={styles.cardTitle}>{new Date(note.date).toLocaleString()}</Text>
      {note.text?.length ? <Text style={{ color: "#3c3460", marginTop: 4 }}>{note.text}</Text> : null}
      {note.items?.length ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.muted}>Добавленные продукты:</Text>
          {note.items.map((it: any) => (
            <Text key={it.uid} style={styles.productLine}>
              • {it.name} — {it.grams} г ({it.kcal} ккал; Б {it.protein} / Ж {it.fat} / У {it.carbs})
            </Text>
          ))}
          <Text style={[styles.muted, { marginTop: 6 }]}>
            Итого: {totals.kcal} ккал; Б {totals.protein} / Ж {totals.fat} / У {totals.carbs}
          </Text>
        </View>
      ) : null}
      <View style={[styles.rowBetween, { marginTop: 12 }]}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{totals.kcal} ккал</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>
              Б {totals.protein} • Ж {totals.fat} • У {totals.carbs}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDelete} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#8A2BE2" />
        </TouchableOpacity>
      </View>
    </PurpleCard>
  );
};

export default function DiaryScreen() {
  const router = useRouter();
  const { notesByDate, setEditingNoteId, setCurrentDate, setNotesByDate } = useApp();

  const dates = Object.keys(notesByDate).sort((a, b) => (a < b ? 1 : -1));

  const onDelete = (dateKey: string, id: string) => {
    Alert.alert("Удалить заметку?", "Действие необратимо.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          const updatedNotes = { ...notesByDate };
          updatedNotes[dateKey] = updatedNotes[dateKey].filter((n: any) => n.id !== id);
          if (updatedNotes[dateKey].length === 0) {
            delete updatedNotes[dateKey];
          }
          setNotesByDate(updatedNotes);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>История</Text>
        {dates.length === 0 ? (
          <Text style={{ color: "#3c3460", marginTop: 10 }}>
            Здесь будут появляться ваши сохранённые заметки по дням.
          </Text>
        ) : (
          dates.map((d) => (
            <View key={d} style={{ marginTop: 14 }}>
              <Text style={styles.sectionLabel}>{new Date(d).toLocaleDateString()}</Text>
              {(notesByDate[d] || []).map((note: any) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => {
                    setEditingNoteId(note.id);
                    setCurrentDate(d);
                    router.push('/');
                  }}
                  onDelete={() => onDelete(d, note.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F2FA" },
  h1: { fontSize: 26, fontWeight: "700", color: "#2a214a" },
  muted: { color: "#6b6292" },
  sectionLabel: { color: "#6b6292", fontWeight: "600", marginBottom: 8 },
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
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pill: {
    backgroundColor: "#EFE7FB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: "#2a214a", fontWeight: "600", fontSize: 12 },
  productLine: { color: "#3c3460", marginTop: 2 },
});