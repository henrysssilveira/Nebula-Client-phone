import { Audio } from 'expo-av';

export async function requestMicrophonePermission() {
  try {
    const { status: existingStatus } = await Audio.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }

    const { status: newStatus } = await Audio.requestPermissionsAsync();
    return newStatus === 'granted';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}

export async function startRecording() {
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    throw new Error('Permissão de microfone negada');
  }

  try {
    // Configure audio mode to allow recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recordingInstance = new Audio.Recording();
    await recordingInstance.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recordingInstance.startAsync();

    return {
      recordingInstance,
      startTime: Date.now(),
    };
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

export async function stopRecording(recordingInstance, startTime) {
  if (!recordingInstance) {
    throw new Error('Nenhuma gravação ativa encontrada');
  }

  try {
    const stopTime = Date.now();
    const status = await recordingInstance.stopAndUnloadAsync();
    
    // Deactivate recording mode to release audio resources
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recordingInstance.getURI();
    const timestamp = new Date(startTime).toISOString();
    
    // Fallback: use manual calculation if durationMillis is 0 or missing
    const durationMs = status.durationMillis > 0 
      ? status.durationMillis 
      : stopTime - startTime;

    return {
      uri,
      durationMs,
      timestamp,
    };
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
}
