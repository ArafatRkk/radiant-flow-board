import { useState, useEffect, useRef, useCallback } from "react";

// Extend Window interface for speech recognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const fullTranscriptRef = useRef("");
  const manualStopRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // CRITICAL: Set continuous to true so it keeps listening
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "bn-BD"; // Bangla (Bangladesh) - also understands English

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Build up the full transcript from all final results
        if (finalTranscript) {
          fullTranscriptRef.current = finalTranscript.trim();
        }
        
        // Show current state: final + interim
        const displayTranscript = (fullTranscriptRef.current + " " + interimTranscript).trim();
        setTranscript(displayTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        // Don't stop on "no-speech" error, just continue
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setIsListening(false);
          setIsFinalizing(false);
        }
      };

      recognition.onend = () => {
        // If user manually stopped, finalize. Otherwise restart if still listening
        if (manualStopRef.current) {
          setIsListening(false);
          setIsFinalizing(true);
          manualStopRef.current = false;
        } else if (isListening) {
          // Auto-restart if not manually stopped (browser may stop after silence)
          try {
            recognition.start();
          } catch (e) {
            console.log("Could not restart recognition:", e);
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      fullTranscriptRef.current = "";
      manualStopRef.current = false;
      setIsFinalizing(false);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      manualStopRef.current = true;
      recognitionRef.current.stop();
      // Don't set isListening to false here - let onend handle it
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    fullTranscriptRef.current = "";
    setIsFinalizing(false);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    isFinalizing,
    startListening,
    stopListening,
    toggleListening,
    setTranscript,
    clearTranscript,
  };
}
