import { useState, useCallback, useRef } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Detect language (simple heuristic: if contains Bangla characters, use Bangla voice)
    const hasBangla = /[\u0980-\u09FF]/.test(text);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    if (hasBangla) {
      // Try to find a Bangla voice
      const banglaVoice = voices.find(v => v.lang.startsWith("bn"));
      if (banglaVoice) {
        utterance.voice = banglaVoice;
        utterance.lang = "bn-BD";
      }
    } else {
      // Use English voice
      const englishVoice = voices.find(v => v.lang.startsWith("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = "en-US";
      }
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
