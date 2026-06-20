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
  const isIntentionalStopRef = useRef(false);

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

  // Salom CurWeb wake-word eshitilganda faol rejimga o'tish yoki tugma orqali
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
    const isFinal = event.results[resultIndex].isFinal || event.results[resultIndex][0].confidence > 0.3;

    if (!transcript || !isFinal) return;

    setLastTranscript(transcript);
    console.log(`[Speech API] Aniqlandi: "${transcript}" (Holat: ${stateRef.current})`);

    // Agar allaqachon activeState = listening bo'lsa (masalan tugma bosilgan bo'lsa), to'g'ridan-to'g'ri buyruqni tekshiramiz
    if (stateRef.current === 'listening') {
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
          activateCommandListening(); // Yana vaqtni uzaytirish
        }
      }
    } 
    // Idle holatida wake-word kutamiz
    else if (stateRef.current === 'idle') {
      if (checkWakeWord(transcript)) {
        activateCommandListening();
      }
    }
  }, [activateCommandListening, resetToIdle, triggerHaptic, onCommandDetected]);

  const startVoiceRecognition = useCallback((manualActive = false) => {
    if (!recognitionRef.current) return;
    
    try {
      isIntentionalStopRef.current = false;
      // Safari requires this to be synchronous to the user gesture!
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
      if (manualActive) {
        activateCommandListening();
      }
    } catch (err) {
      console.warn('SpeechRecognition allaqachon ishlamoqda yoki ulanolmadi.', err);
      if (manualActive) {
         activateCommandListening(); // Allaqachon ishlayotgan bo'lsa ham faollashtiramiz
      }
    }
  }, [activateCommandListening]);

  const stopVoiceRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      isIntentionalStopRef.current = true;
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
      setError('Sizning brauzeringiz Web Speech API-ni qo\'llab-quvvatlamaydi. Ovozli boshqaruv ishlamaydi.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // iOS va Telegram WebApp uchun ishonchliroq ishlaydi
    recognition.interimResults = false;
    recognition.lang = 'uz-UZ';

    recognition.onresult = handleSpeechResult;

    recognition.onerror = (event) => {
      console.error('[Speech API] Xato yuz berdi:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError("Mikrofonga ruxsat yo'q. Telegram yuqori o'ng burchagidagi 3 nuqtani bosib, 'Brauzerda ochish' (Open in Browser) ni tanlang.");
        setIsListening(false);
        isIntentionalStopRef.current = true;
      }
    };

    recognition.onend = () => {
      if (!isIntentionalStopRef.current) {
        // Avtomatik qayta ishga tushirish (Continuous o'rniga ishonchliroq usul)
        setTimeout(() => {
          try {
            if (!isIntentionalStopRef.current) {
               recognitionRef.current?.start();
            }
          } catch (e) {
            // e'tiborga olmaslik
          }
        }, 400);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isIntentionalStopRef.current = true;
        recognitionRef.current.stop();
      }
    };
  }, [handleSpeechResult]);

  return {
    isSupported,
    isListening,
    activeState,
    lastTranscript,
    error,
    startVoiceRecognition,
    stopVoiceRecognition
  };
}
