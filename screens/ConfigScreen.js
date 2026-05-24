import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export function ConfigScreen({ initialConfig, onSave, onCancel, showCancel }) {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setApiKey(initialConfig.apiKey || '');
      setWebhookUrl(initialConfig.webhookUrl || '');
    }
  }, [initialConfig]);

  const validateUrl = (url) => {
    const pattern = /^https?:\/\/.+/i;
    return pattern.test(url);
  };

  const handleSave = async () => {
    setError('');
    const cleanApiKey = apiKey.trim();
    const cleanWebhookUrl = webhookUrl.trim();

    if (!cleanApiKey || !cleanWebhookUrl) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    if (!validateUrl(cleanWebhookUrl)) {
      setError('Insira uma URL válida.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(cleanApiKey, cleanWebhookUrl);
    } catch (err) {
      setError('Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Acesso</Text>
            <Text style={styles.subtitle}>Configure suas chaves para sincronização.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chave de API</Text>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={(text) => { setError(''); setApiKey(text); }}
                placeholder="Insira sua chave"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Webhook</Text>
              <TextInput
                style={styles.input}
                value={webhookUrl}
                onChangeText={(text) => { setError(''); setWebhookUrl(text); }}
                placeholder="https://..."
                placeholderTextColor="#A0A0A0"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Conectar</Text>}
            </TouchableOpacity>

            {showCancel && (
              <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Voltar</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    opacity: 0.5,
    marginTop: 8,
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#0D47FF',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
    opacity: 0.4,
    fontWeight: '600',
  },
});
