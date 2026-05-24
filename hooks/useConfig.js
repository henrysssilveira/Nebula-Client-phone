import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  API_KEY: '@voice_recorder:api_key',
  WEBHOOK_URL: '@voice_recorder:webhook_url',
  TASKS_WEBHOOK_URL: '@voice_recorder:tasks_webhook_url',
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
      const [apiKey, webhookUrl, tasksWebhookUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.WEBHOOK_URL),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS_WEBHOOK_URL),
      ]);

      if (apiKey && webhookUrl) {
        setConfig({ apiKey, webhookUrl, tasksWebhookUrl: tasksWebhookUrl || '' });
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

  async function saveConfig(apiKey, webhookUrl, tasksWebhookUrl = '') {
    try {
      setLoading(true);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey),
        AsyncStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, webhookUrl),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS_WEBHOOK_URL, tasksWebhookUrl),
      ]);
      setConfig({ apiKey, webhookUrl, tasksWebhookUrl });
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
        AsyncStorage.removeItem(STORAGE_KEYS.TASKS_WEBHOOK_URL),
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
