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
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
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

    if (!cleanApiKey) {
      setError('A chave de API é obrigatória.');
      return;
    }

    if (!cleanWebhookUrl) {
      setError('A URL do Webhook é obrigatória.');
      return;
    }

    if (!validateUrl(cleanWebhookUrl)) {
      setError('Por favor, insira uma URL de Webhook válida (começando com http:// ou https://).');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(cleanApiKey, cleanWebhookUrl);
    } catch (err) {
      setError('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Neon Background Glows */}
          <View style={styles.glow1} />
          <View style={styles.glow2} />

          <View style={styles.header}>
            <Text style={styles.title}>Configurações</Text>
            <Text style={styles.subtitle}>
              Configure suas credenciais para enviar gravações de voz automaticamente.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Key</Text>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={(text) => {
                  setError('');
                  setApiKey(text);
                }}
                placeholder="Insira sua chave de API"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Webhook URL</Text>
              <TextInput
                style={styles.input}
                value={webhookUrl}
                onChangeText={(text) => {
                  setError('');
                  setWebhookUrl(text);
                }}
                placeholder="https://seu-webhook.com/audio"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
              style={styles.saveButtonContainer}
            >
              <LinearGradient
                colors={['#8F00FF', '#FF007F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar Configuração</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {showCancel && onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={isSaving}
                style={styles.cancelButton}
              >
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
    backgroundColor: '#0A0812',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  glow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(143, 0, 255, 0.15)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 0, 127, 0.15)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFF',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
});
