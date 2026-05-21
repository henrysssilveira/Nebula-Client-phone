import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { startRecording, stopRecording } from '../services/audioService';
import { sendAudioToWebhook } from '../services/webhookService';

export function HomeScreen({ config, onOpenConfig }) {
  // States: 'idle' | 'recording' | 'sending' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordTime, setRecordTime] = useState(0);

  const recordingRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  // Pulse animation for recording state
  useEffect(() => {
    let pulseAnimation;
    if (status === 'recording') {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.6);
      
      pulseAnimation = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [status]);

  // Audio timer
  useEffect(() => {
    if (status === 'recording') {
      setRecordTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status]);

  const handlePressIn = async () => {
    // Vibrate to give physical feedback
    Vibration.vibrate(50);
    
    // Scale down button slightly on press
    Animated.timing(buttonScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    try {
      setStatus('recording');
      setErrorMessage('');
      
      const { recordingInstance, startTime } = await startRecording();
      recordingRef.current = recordingInstance;
      startTimeRef.current = startTime;
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao acessar o microfone');
      Vibration.vibrate([0, 100, 50, 100]); // Error vibration pattern
      
      // Return to idle after 4s
      setTimeout(() => {
        setStatus('idle');
      }, 4000);
    }
  };

  const handlePressOut = async () => {
    // Scale button back up
    Animated.timing(buttonScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    if (status !== 'recording' || !recordingRef.current) {
      return;
    }

    setStatus('sending');
    Vibration.vibrate(50);

    try {
      const { uri, durationMs, timestamp } = await stopRecording(
        recordingRef.current,
        startTimeRef.current
      );

      // Reset ref
      recordingRef.current = null;
      startTimeRef.current = null;

      // UX: Reject extremely short recordings
      if (durationMs < 600) {
        setStatus('error');
        setErrorMessage('Gravação muito curta.');
        Vibration.vibrate([0, 100, 50, 100]);
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      // Send to webhook
      await sendAudioToWebhook(uri, config, { durationMs, timestamp });

      setStatus('success');
      Vibration.vibrate([0, 80, 50, 80]); // Success vibration pattern
      
      // Return to idle after 3s
      setTimeout(() => {
        setStatus('idle');
      }, 3000);

    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao enviar gravação');
      Vibration.vibrate([0, 100, 50, 100]);
      
      // Return to idle after 4s
      setTimeout(() => {
        setStatus('idle');
      }, 4000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine colors based on state
  const getGradientColors = () => {
    switch (status) {
      case 'recording':
        return ['#FF007F', '#FF5E3A']; // Magenta -> Coral
      case 'sending':
        return ['#00F2FE', '#4FACFE']; // Cyan -> Blue
      case 'success':
        return ['#00FF87', '#60EFFF']; // Neon Green -> Mint
      case 'error':
        return ['#FF416C', '#FF4B2B']; // Pink Red -> Red
      case 'idle':
      default:
        return ['#8F00FF', '#FF007F']; // Violet -> Magenta
    }
  };

  // Determine instructions and sub-texts
  const getStatusText = () => {
    switch (status) {
      case 'recording':
        return 'Gravando...';
      case 'sending':
        return 'Enviando...';
      case 'success':
        return 'Enviado com sucesso!';
      case 'error':
        return 'Falha no envio';
      case 'idle':
      default:
        return 'Segure para gravar';
    }
  };

  const renderIcon = () => {
    const size = 64;
    const color = '#FFF';

    switch (status) {
      case 'recording':
        return <Ionicons name="mic" size={size} color={color} />;
      case 'sending':
        return <Ionicons name="cloud-upload" size={size} color={color} />;
      case 'success':
        return <Ionicons name="checkmark-circle-outline" size={size} color={color} />;
      case 'error':
        return <Ionicons name="alert-circle-outline" size={size} color={color} />;
      case 'idle':
      default:
        return <Ionicons name="mic-outline" size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Decorative Blurs */}
      <View style={[styles.blurBg, styles.blur1]} />
      <View style={[styles.blurBg, styles.blur2]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#8F00FF', '#FF007F']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="headset-outline" size={20} color="#FFF" />
          </LinearGradient>
          <Text style={styles.logoText}>VibeRec</Text>
        </View>
        
        <TouchableOpacity
          onPress={onOpenConfig}
          style={styles.configButton}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Timer Display */}
        <View style={styles.timerContainer}>
          {status === 'recording' ? (
            <Text style={styles.timerText}>{formatTime(recordTime)}</Text>
          ) : status === 'error' && errorMessage ? (
            <Text style={styles.errorSubText} numberOfLines={2}>
              {errorMessage}
            </Text>
          ) : (
            <Text style={styles.timerPlaceholder}>00:00</Text>
          )}
        </View>

        {/* Outer Pulsing Aura */}
        <View style={styles.buttonWrapper}>
          {status === 'recording' && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
          )}

          {/* Recording Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
              disabled={status === 'sending' || status === 'success'}
            >
              <LinearGradient
                colors={getGradientColors()}
                style={styles.recordButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {renderIcon()}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Status Text & Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={[
            styles.statusText,
            status === 'success' && styles.successColor,
            status === 'error' && styles.errorColor
          ]}>
            {getStatusText()}
          </Text>
          <Text style={styles.subInstruction}>
            {status === 'recording'
              ? 'Solte o botão para enviar o áudio'
              : status === 'idle'
              ? 'Pressione e segure o círculo central para falar'
              : 'Processando a gravação...'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0812',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  configButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurBg: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    pointerEvents: 'none',
  },
  blur1: {
    backgroundColor: 'rgba(143, 0, 255, 0.1)',
    top: '15%',
    left: '-20%',
    filter: 'blur(100px)',
  },
  blur2: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    bottom: '15%',
    right: '-20%',
    filter: 'blur(100px)',
  },
  timerContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  timerPlaceholder: {
    fontSize: 48,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.15)',
    letterSpacing: 1,
  },
  errorSubText: {
    fontSize: 14,
    color: '#FF4B4B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  buttonWrapper: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF007F',
    zIndex: 0,
  },
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#8F00FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subInstruction: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  successColor: {
    color: '#00FF87',
  },
  errorColor: {
    color: '#FF4B4B',
  },
});
