/**
 * src/components/ai/VoiceInput.tsx
 * Web Speech API voice-to-text input for the AI chat
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: 'en' | 'hi' | 'kn';
}

const LANG_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

const VoiceInput: React.FC<Props> = ({ onTranscript, disabled = false, language = 'en' }) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [level, setLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setLevel(0);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_CODES[language];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      // Fake audio level animation
      const animate = () => {
        setLevel(Math.random());
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) onTranscript(transcript);
      stopListening();
    };

    recognition.onerror = () => stopListening();
    recognition.onend   = () => stopListening();

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript, stopListening]);

  const toggle = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Voice input'}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `1px solid ${listening ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
        background: listening
          ? `rgba(239,68,68,${0.15 + level * 0.2})`
          : 'rgba(255,255,255,0.05)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
        boxShadow: listening ? `0 0 ${8 + level * 12}px rgba(239,68,68,0.4)` : 'none',
      }}
    >
      {listening ? (
        /* Stop icon */
        <span style={{ display: 'block', width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
      ) : (
        /* Mic icon */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8"  y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
};

export default VoiceInput;
