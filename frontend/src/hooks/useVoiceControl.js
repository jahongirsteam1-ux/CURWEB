import { useEffect, useRef, useState, useCallback } from 'react';
import { checkWakeWord, parseVoiceCommand } from '../utils/voiceCommandParser';

/**
 * Web Speech API orqali ovozli boshqaruv hook.
 * Salom CurWeb wake-word mexanizmi va 4-5 soniyali faol kutish vaqtini boshqaradi.
 */
export function useVoiceControl(options = {}) {
  const { onCommandDetected, triggerHaptic } = options;

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false); // Umumiy eshitish statusi
  const [activeState, setActiveState] = useState('idle'); // 'idle' (wake-word kutish) yoki 'listening' (buyruq kutish)
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const activeTimeoutRef = useRef(null);
  const stateRef = useRef('idle'); // React State kechikishi uchun ref ishlatiladi

  // Status ref-ni yangilab borish
  useEffect(() => {
    stateRef.current = activeState;
  }, [activeState]);

  // Faol holatdan chiqish (timeout)
  const resetToIdle = useCallback(() => {
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
    setActiveState('idle');
    console.log('[Voice] Holat: idle (Wake-word kutilmoqda...)');
  }, []);

  // Salom CurWeb wake-word eshitilganda faol rejimga o'tish
  const activateCommandListening = useCallback(() => {
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
    }

    setActiveState('listening');
    console.log('[Voice] Holat: listening (Buyruq kutilmoqda...)');
    
    if (triggerHaptic) triggerHaptic('medium');

    // 5 soniyadan keyin buyruq aytilmasa avtomatik orqaga qaytish
    activeTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === 'listening') {
        resetToIdle();
        if (triggerHaptic) triggerHaptic('warning');
        if (onCommandDetected) {
          onCommandDetected({ 
            type: 'TIMEOUT', 
            message: 'Vaqt tugadi. Qayta urinib ko\'ring.' 
          });
        }
      }
    }, 5000);
  }, [triggerHaptic, resetToIdle, onCommandDetected]);

  // Ovozni aniqlash natijalari
  const handleSpeechResult = useCallback((event) => {
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript.trim();
    const isFinal = event.results[resultIndex][0].confidence > 0.3; // isFinal tekshiruvi

    if (!transcript || !isFinal) return;

    setLastTranscript(transcript);
    console.log(`[Speech API] Aniqlandi: "${transcript}" (Holat: ${stateRef.current})`);

    // 1. Wake-word rejimida
    if (stateRef.current === 'idle') {
      if (checkWakeWord(transcript)) {
        activateCommandListening();
      }
    } 
    // 2. Buyruq kutish rejimida
    else if (stateRef.current === 'listening') {
      const parsed = parseVoiceCommand(transcript);
      
      if (parsed) {
        // Buyruq aniqlandi
        resetToIdle();
        if (triggerHaptic) triggerHaptic('success');
        if (onCommandDetected) {
          onCommandDetected({
            type: 'COMMAND',
            ...parsed
          });
        }
      } else {
        // Agar tushunarsiz buyruq bo'lsa va u "Salom CurWeb" bo'lmasa
        if (!checkWakeWord(transcript)) {
          resetToIdle();
          if (triggerHaptic) triggerHaptic('error');
          if (onCommandDetected) {
            onCommandDetected({
              type: 'UNKNOWN',
              message: 'Bu buyruqni tushunmadim, qaytadan urinib ko\'ring',
              raw: transcript
            });
          }
        } else {
          // Agar yana wake-word aytilgan bo'lsa, vaqtni uzaytiramiz
          activateCommandListening();
        }
      }
    }
  }, [activateCommandListening, resetToIdle, triggerHaptic, onCommandDetected]);

  const startVoiceRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.warn('SpeechRecognition allaqachon ishlamoqda yoki ulanolmadi.', err);
    }
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      resetToIdle();
    } catch (err) {
      console.error(err);
    }
  }, [resetToIdle]);

  // Speech API-ni sozlash
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Sizning brauzeringiz Web Speech API-ni qo\'llab-quvvatlamaydi. Chrome yoki Safari ishlatib ko\'ring.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'uz-UZ'; // O'zbek tiliga moslash

    recognition.onresult = handleSpeechResult;

    recognition.onerror = (event) => {
      console.error('[Speech API] Xato yuz berdi:', event.error);
      if (event.error === 'not-allowed') {
        setError('Mikrofonga ruxsat berilmadi. Sozlamalardan mikrofonni yoqing.');
      }
    };

    recognition.onend = () => {
      // Agar foydalanuvchi o'zi to'xtatmagan bo'lsa, avtomatik qayta ishga tushiramiz (continuous ishonchli ishlashi uchun)
      if (isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Allaqachon boshlangan bo'lishi mumkin
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handleSpeechResult, isListening]);

  return {
    isSupported,
    isListening,
    activeState, // 'idle' | 'listening'
    lastTranscript,
    error,
    startVoiceRecognition,
    stopVoiceRecognition
  };
}
