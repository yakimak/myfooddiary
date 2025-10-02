import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { AppProvider } from './context/AppContext';

export default function TabLayout() {
  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#8A2BE2",
          headerStyle: { backgroundColor: "#8A2BE2" },
          headerTintColor: "white",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Дневник",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            title: "История",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Прогресс",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Профиль",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="food-search"
          options={{
            title: "Поиск продуктов",
            href: null,
          }}
        />
      </Tabs>
    </AppProvider>
  );
}