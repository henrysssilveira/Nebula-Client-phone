import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { startRecording, stopRecording } from '../services/audioService';
import { sendAudioToWebhook } from '../services/webhookService';

export function HomeScreen({ config, onOpenConfig, onOpenTasks }) {
  // States: 'idle' | 'recording' | 'sending' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordTime, setRecordTime] = useState(0);

  const recordingRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const breathingAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation for idle/recording
  useEffect(() => {
    let animation;
    if (status === 'idle' || status === 'recording') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }
    return () => animation?.stop();
  }, [status]);

  // Audio timer
  useEffect(() => {
    if (status === 'recording') {
      setRecordTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [status]);

  const handlePressIn = async () => {
    Vibration.vibrate(40);
    Animated.spring(buttonScale, { toValue: 0.9, useNativeDriver: true }).start();

    try {
      setStatus('recording');
      setErrorMessage('');
      const { recordingInstance, startTime } = await startRecording();
      recordingRef.current = recordingInstance;
      startTimeRef.current = startTime;
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Erro no microfone');
      Vibration.vibrate([0, 100, 50, 100]);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const handlePressOut = async () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    if (status !== 'recording' || !recordingRef.current) return;

    setStatus('sending');
    Vibration.vibrate(40);

    try {
      const { uri, durationMs, timestamp } = await stopRecording(recordingRef.current, startTimeRef.current);
      recordingRef.current = null;
      startTimeRef.current = null;

      if (durationMs < 600) {
        setStatus('error');
        setErrorMessage('Muito curto');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      await sendAudioToWebhook(uri, config, { durationMs, timestamp });
      setStatus('success');
      Vibration.vibrate([0, 80, 50, 80]);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erro no envio');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Gradient Overlay */}
      <View style={styles.gradientOverlay}>
        <LinearGradient
          colors={['rgba(95, 125, 255, 0.12)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.brandText}>Nebula</Text>
        <TouchableOpacity onPress={onOpenConfig} style={styles.settingsButton}>
          <Ionicons name="settings-sharp" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Central Content */}
      <View style={styles.content}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>
            {status === 'recording' ? formatTime(recordTime) : 
             status === 'sending' ? 'Processando...' : 
             status === 'success' ? 'Concluído' :
             status === 'error' ? errorMessage : 'Pronto'}
          </Text>
        </View>

        <Animated.View style={[
          styles.orbContainer,
          { transform: [{ scale: Animated.multiply(buttonScale, breathingAnim) }] }
        ]}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            disabled={status === 'sending'}
          >
            <LinearGradient
              colors={['#7FA7FF', '#003DFF', '#1717A8']}
              style={styles.voiceOrb}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons 
                name={status === 'recording' ? "mic" : "mic-outline"} 
                size={48} 
                color="#FFF" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hintText}>
          {status === 'recording' ? 'Estou ouvindo...' : 'Como posso ajudar hoje?'}
        </Text>
      </View>

      {/* Floating Navbar */}
      <View style={styles.navbarContainer}>
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.navItem} onPress={onOpenTasks}>
            <Ionicons name="newspaper-outline" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
            <Ionicons name="mic" size={30} color="#0D47FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="pin-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  topBar: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  statusInfo: {
    marginBottom: 40,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    opacity: 0.4,
    textAlign: 'center',
  },
  orbContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 40,
  },
  voiceOrb: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hintText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    opacity: 0.6,
  },
  navbarContainer: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  navbar: {
    width: 300,
    height: 72,
    backgroundColor: 'rgba(236, 236, 236, 0.92)',
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
  },
  navItem: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    // Optional highlight
  },
});
