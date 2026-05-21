import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useConfig } from './hooks/useConfig';
import { HomeScreen } from './screens/HomeScreen';
import { ConfigScreen } from './screens/ConfigScreen';

export default function App() {
  const { config, loading, saveConfig } = useConfig();
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'config'
  
  // Animation value for screen transition
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Sync screen state with configuration presence
  useEffect(() => {
    if (!loading) {
      if (!config) {
        setCurrentScreen('config');
      } else {
        setCurrentScreen('home');
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

  const handleSaveConfig = async (apiKey, webhookUrl) => {
    await saveConfig(apiKey, webhookUrl);
    navigateTo('home');
  };

  const handleCancelConfig = () => {
    if (config) {
      navigateTo('home');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#8F00FF" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />
      
      {currentScreen === 'config' ? (
        <ConfigScreen
          initialConfig={config}
          onSave={handleSaveConfig}
          onCancel={handleCancelConfig}
          showCancel={!!config}
        />
      ) : (
        <HomeScreen
          config={config}
          onOpenConfig={() => navigateTo('config')}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0812',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0812',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
