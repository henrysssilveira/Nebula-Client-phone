export async function sendAudioToWebhook(audioUri, config, metadata) {
  const { apiKey, webhookUrl } = config;
  const { durationMs, timestamp } = metadata;

  if (!webhookUrl) {
    throw new Error('URL do webhook não configurada');
  }

  // Prepare FormData
  const formData = new FormData();
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('duration_ms', durationMs.toString());
  
  // React Native expects an object with uri, name, and type for file uploads
  formData.append('audio', {
    uri: audioUri,
    name: `recording_${Date.now()}.m4a`,
    type: 'audio/m4a',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000); // 10 seconds timeout

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // Note: We do NOT explicitly set Content-Type header to 'multipart/form-data'.
      // If we do, the boundary parameter automatically created by the fetch API will be lost,
      // which causes servers to fail to parse the body.
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook respondeu com status ${response.status}: ${errorText || response.statusText}`);
    }

    // Try parsing as JSON, fallback to text if not JSON
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('O envio excedeu o limite de tempo (10 segundos)');
    }
    console.error('Webhook sending error:', error);
    throw error;
  }
}
