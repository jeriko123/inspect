import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Settings as SettingsIcon } from 'lucide-react-native';

// CSS Import for NativeWind v4
import './global.css';

// Config Imports
import './i18n'; 
import { initDatabase } from './db/database';
import { useAppStore } from './store/useAppStore';

// Screen Imports
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddObservationScreen from './screens/AddObservationScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigator for Dashboard flow (Dashboard -> Add Observation)
function DashboardStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#18181b' }, // zinc-900
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#09090b' }, // zinc-950
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
      />
      <Stack.Screen 
        name="AddObservation" 
        component={AddObservationScreen} 
        options={{ title: t('add.title') }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator (DashboardStack + SettingsScreen)
function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#18181b' }, // zinc-900
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#18181b', // zinc-900
          borderTopColor: '#27272a', // zinc-800
          paddingTop: 6,
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: '#10b981', // emerald-500
        tabBarInactiveTintColor: '#71717a', // zinc-500
      }}
    >
      <Tab.Screen
        name="HistoryTab"
        component={DashboardStack}
        options={{
          headerShown: false, // Stack has its own header
          tabBarLabel: t('dashboard.title'),
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings.title'),
          title: t('settings.title'),
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const inspectorName = useAppStore((state) => state.inspectorName);

  // Initialize SQLite database on startup
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <View className="flex-1 bg-zinc-950">
        {!inspectorName ? (
          <WelcomeScreen />
        ) : (
          <MainTabNavigator />
        )}
      </View>
    </NavigationContainer>
  );
}
