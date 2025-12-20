import { useCallback, useEffect, useRef } from 'react';

export const useTextToSpeech = () => {
    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Cancel any current speaking
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX'; // Mexican Spanish preference
            utterance.rate = 1; // Normal speed
            
            // Fallback to generic Spanish if MX not available
            const voices = window.speechSynthesis.getVoices();
            const esVoice = voices.find(v => v.lang.includes('es-MX')) || voices.find(v => v.lang.includes('es'));
            if (esVoice) utterance.voice = esVoice;

            if (onEnd) {
                utterance.onend = onEnd;
            }

            window.speechSynthesis.speak(utterance);
        } else {
             // If no TTS support, just call onEnd immediately to proceed
             if (onEnd) onEnd();
        }
    }, []);

    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, stopSpeaking };
};
