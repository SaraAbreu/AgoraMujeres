import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

// Importar Speech de forma segura (puede no estar instalado)
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.warn('expo-speech not installed, TTS will be disabled');
}

export interface UseVoiceOptions {
  language?: string;
  deviceId?: string;
  baseUrl?: string;
  enableSpeak?: boolean;  // Opcional - habilitar síntesis de voz
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export const useVoice = (options: UseVoiceOptions = {}) => {
  const { 
    language = 'es-ES', 
    deviceId = 'default-device',
    baseUrl = 'http://localhost:8000',
    enableSpeak = true,  // Por defecto habilitado
    onResult, 
    onError 
  } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Solicitar permisos de audio
  const requestAudioPermission = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.granted;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      onError?.('No se pudieron obtener permisos de audio');
      return false;
    }
  }, [onError]);

  // Iniciar grabación de voz
  const startListening = useCallback(async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        Alert.alert('Permiso denegado', 'Se necesita acceso al micrófono para usar entrada de voz');
        return;
      }

      // Configurar audio para grabación
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsListening(true);

      // Timeout automático después de 30 segundos
      const timeout = setTimeout(() => {
        stopListening();
      }, 30000);

      // Guardar timeout para limpieza
      timeoutRef.current = timeout;
    } catch (error) {
      console.error('Error starting voice recording:', error);
      onError?.('Error al iniciar grabación');
      setIsListening(false);
    }
  }, [requestAudioPermission, onError]);

  // Detener grabación y procesar
  const stopListening = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setIsListening(false);

      // Limpiar timeout si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (!uri) {
        onError?.('No se grabó audio');
        return;
      }

      // Enviar audio al backend para transcripción
      try {
        const langCode = language === 'es-ES' ? 'es' : 'en';
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: 'audio/m4a',
          name: `audio_${Date.now()}.m4a`,
        } as any);
        formData.append('device_id', deviceId);
        formData.append('language', langCode);

        const response = await fetch(`${baseUrl}/api/transcribe?device_id=${deviceId}&language=${langCode}`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Transcription API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'success' && data.text) {
          onResult?.(data.text);
        } else {
          onError?.('Error transcribiendo audio: ' + (data.error || 'desconocido'));
        }
      } catch (transcriptionError) {
        console.error('Transcription API error:', transcriptionError);
        onError?.('Error conectando con servicio de transcripción');
      }

      recordingRef.current = null;
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      onError?.('Error al procesar grabación');
      setIsListening(false);
    }
  }, [onResult, onError, deviceId, language, baseUrl]);

  // Reproducir texto en voz (para respuestas de Ágora)
  const speak = useCallback(
    async (text: string, language_code: string = language) => {
      // Si la síntesis de voz está deshabilitada, no hacer nada
      if (!enableSpeak) {
        console.log('Voice output disabled by user');
        return;
      }

      // Si Speech no está disponible, no hacer nada
      if (!Speech) {
        console.warn('expo-speech not available, text-to-speech disabled');
        return;
      }

      try {
        setIsSpeaking(true);
        
        // Acortar texto si es muy largo (máximo 200 caracteres por síntesis)
        const chunks = text.match(/[\s\S]{1,200}/g) || [];
        
        for (const chunk of chunks) {
          await Speech.speak(chunk, {
            language: language_code,
            pitch: 1.0,
            rate: 0.9,
            onDone: () => {
              if (chunk === chunks[chunks.length - 1]) {
                setIsSpeaking(false);
              }
            },
            onError: (error: Error) => {
              console.error('Speech API error:', error);
              onError?.('Error al reproducir audio');
              setIsSpeaking(false);
            },
          });
        }
      } catch (error) {
        console.error('Error speaking:', error);
        onError?.('Error al reproducir');
        setIsSpeaking(false);
      }
    },
    [language, enableSpeak, onError]
  );

  // Detener reproducción de voz
  const stopSpeaking = useCallback(() => {
    if (Speech) {
      Speech.stop();
    }
    setIsSpeaking(false);
  }, []);

  // Limpiar recursos al desmontar
  const cleanup = useCallback(async () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error cleaning up recording:', error);
      }
      recordingRef.current = null;
    }
  }, [isSpeaking, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    cleanup,
  };
};
