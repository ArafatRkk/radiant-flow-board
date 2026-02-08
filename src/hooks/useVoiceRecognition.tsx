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
  const cancelledRef = useRef(false);
  const isListeningRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Set continuous to true so it keeps listening
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
        console.log("Voice transcript:", displayTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        // Don't stop on "no-speech" or "aborted" errors
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setIsListening(false);
          setIsFinalizing(false);
        }
      };

      recognition.onend = () => {
        console.log("Recognition ended. Manual stop:", manualStopRef.current, "Cancelled:", cancelledRef.current);
        
        if (cancelledRef.current) {
          // User cancelled - don't finalize, just stop
          cancelledRef.current = false;
          setIsListening(false);
          setIsFinalizing(false);
        } else if (manualStopRef.current) {
          // User clicked stop to send - finalize
          manualStopRef.current = false;
          setIsListening(false);
          setIsFinalizing(true);
          console.log("Finalizing with transcript:", fullTranscriptRef.current);
        } else if (isListeningRef.current) {
          // Auto-restart if browser stopped due to silence
          try {
            console.log("Auto-restarting recognition...");
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
  }, []); // Empty dependency array - only run once

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      console.log("Starting voice recognition...");
      setTranscript("");
      fullTranscriptRef.current = "";
      manualStopRef.current = false;
      cancelledRef.current = false;
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
      console.log("Stopping voice recognition to send...");
      manualStopRef.current = true;
      cancelledRef.current = false;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      console.log("Cancelling voice recognition...");
      cancelledRef.current = true;
      manualStopRef.current = false;
      fullTranscriptRef.current = "";
      setTranscript("");
      recognitionRef.current.abort();
      setIsListening(false);
      setIsFinalizing(false);
    }
  }, []);

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
    cancelListening,
    toggleListening,
    setTranscript,
    clearTranscript,
  };
}
