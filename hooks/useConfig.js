import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  API_KEY: '@voice_recorder:api_key',
  WEBHOOK_URL: '@voice_recorder:webhook_url',
};

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const [apiKey, webhookUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.WEBHOOK_URL),
      ]);

      if (apiKey && webhookUrl) {
        setConfig({ apiKey, webhookUrl });
      } else {
        setConfig(null);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(apiKey, webhookUrl) {
    try {
      setLoading(true);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey),
        AsyncStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, webhookUrl),
      ]);
      setConfig({ apiKey, webhookUrl });
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function clearConfig() {
    try {
      setLoading(true);
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.removeItem(STORAGE_KEYS.WEBHOOK_URL),
      ]);
      setConfig(null);
    } catch (error) {
      console.error('Error clearing config:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    config,
    loading,
    saveConfig,
    clearConfig,
  };
}
