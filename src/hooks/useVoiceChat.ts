import { useState, useRef, useCallback, useEffect } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export interface VoiceSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
}

export const useVoiceChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: null,
    rate: 1,
    pitch: 1,
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      setAvailableVoices(voices);
      
      // Set default voice (prefer English)
      if (voices.length > 0 && !voiceSettings.voice) {
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        setVoiceSettings(prev => ({ ...prev, voice: englishVoice }));
      }
    };

    loadVoices();
    synthRef.current?.addEventListener('voiceschanged', loadVoices);

    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceSettings.voice) {
      utterance.voice = voiceSettings.voice;
    }
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [voiceSettings]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setVoiceSettings(prev => ({ ...prev, voice }));
  }, []);

  const setRate = useCallback((rate: number) => {
    setVoiceSettings(prev => ({ ...prev, rate }));
  }, []);

  const setPitch = useCallback((pitch: number) => {
    setVoiceSettings(prev => ({ ...prev, pitch }));
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    availableVoices,
    voiceSettings,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoice,
    setRate,
    setPitch,
    setTranscript,
  };
};
