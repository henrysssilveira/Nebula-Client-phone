import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useConfig } from './hooks/useConfig';
import { HomeScreen } from './screens/HomeScreen';
import { ConfigScreen } from './screens/ConfigScreen';
import { TasksScreen } from './screens/TasksScreen';

export default function App() {
  const { config, loading, saveConfig } = useConfig();
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'config' | 'tasks'
  
  // Animation value for screen transition
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Sync screen state with configuration presence
  useEffect(() => {
    if (!loading) {
      if (!config) {
        setCurrentScreen('config');
      } else {
        // Keep current screen if it's already a valid one
        if (currentScreen === 'config') setCurrentScreen('home');
      }
    }
  }, [config, loading]);

  const navigateTo = (screen) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen(screen);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSaveConfig = async (apiKey, webhookUrl, tasksWebhookUrl) => {
    await saveConfig(apiKey, webhookUrl, tasksWebhookUrl);
    navigateTo('home');
  };

  const handleSaveTasksWebhook = async (tasksWebhookUrl) => {
    if (config) {
      await saveConfig(config.apiKey, config.webhookUrl, tasksWebhookUrl);
    }
  };

  const handleCancelConfig = () => {
    if (config) {
      navigateTo('home');
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <StatusBar style="light" />
          <ActivityIndicator size="large" color="#0D47FF" />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'config':
        return (
          <ConfigScreen
            initialConfig={config}
            onSave={handleSaveConfig}
            onCancel={handleCancelConfig}
            showCancel={!!config}
          />
        );
      case 'tasks':
        return (
          <TasksScreen
            config={config}
            onSaveTasksWebhook={handleSaveTasksWebhook}
            onBack={() => navigateTo('home')}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            config={config}
            onOpenConfig={() => navigateTo('config')}
            onOpenTasks={() => navigateTo('tasks')}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <StatusBar style="light" />
        {renderScreen()}
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
