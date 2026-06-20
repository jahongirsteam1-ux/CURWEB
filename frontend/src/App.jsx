import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  HelpCircle, Sparkles, Smartphone, Monitor, Shield, Settings, 
  RefreshCw, CheckCircle, AlertTriangle, Play, Pause, Send, Info, Eye
} from 'lucide-react';

import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useHandTracking } from './hooks/useHandTracking';
import { useVoiceControl } from './hooks/useVoiceControl';
import { useMultitouch } from './hooks/useMultitouch';

import CoordinateMapper from './utils/coordinateMapper';
import TouchSimulator from './utils/touchSimulator';
import GestureRecognizer from './utils/gestureRecognizer';

import TutorialModal from './components/Onboarding/TutorialModal';
import CursorOverlay from './components/Controls/CursorOverlay';
import CameraPiP from './components/Controls/CameraPiP';
import VoiceIndicator from './components/Controls/VoiceIndicator';
import UpgradeModal from './components/Subscription/UpgradeModal';
import TierBadge from './components/Subscription/TierBadge';

const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

export default function App() {
  const { user, initData, triggerHaptic } = useTelegramWebApp();

  // Rejimlar: 'local' (yagona qurilma) | 'controller' (mobil pult) | 'receiver' (kompyuter ekrani)
  const [appMode, setAppMode] = useState('local');
  const [userTier, setUserTier] = useState('free');
  const [subExpiresAt, setSubExpiresAt] = useState(null);

  // Modal holatlari
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  // Bog'lanish holatlari
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [pairingPin, setPairingPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [pairingStatus, setPairingStatus] = useState('idle'); // 'idle' | 'pending' | 'paired' | 'error'

  // Kursor va imo-ishora holatlari
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [currentGesture, setCurrentGesture] = useState('idle');
  const [multitouchPoints, setMultitouchPoints] = useState([]);
  
  // Ovozli buyruq holatlari
  const [lastVoiceCommand, setLastVoiceCommand] = useState(null);
  const [timerText, setTimerText] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [screenBrightnessOverlay, setScreenBrightnessOverlay] = useState(0); // 0 (normal) -> 0.7 (qorong'u)
  
  // Utils refs
  const mapperRef = useRef(new CoordinateMapper(0.22));
  const simulatorRef = useRef(new TouchSimulator());
  const recognizerRef = useRef(new GestureRecognizer());

  // Sinov test media elementi (ovoz sozlamalari uchun)
  const mediaRef = useRef(null);
  const [mediaVolume, setMediaVolume] = useState(0.5);

  // Sandbx / test maydoni uchun input ref
  const testInputRef = useRef(null);

  // 1. Foydalanuvchi ma'lumotlarini yuklash
  const fetchUserStatus = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (initData) {
        headers['x-telegram-init-data'] = initData;
      }
      
      const res = await fetch(`${SERVER_URL}/api/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUserTier(data.subscription_tier);
        setSubExpiresAt(data.subscription_expires_at);
      }
    } catch (e) {
      console.warn("Server ulanishida xatolik, mock ma'lumotlar bilan davom etamiz.");
    }
  }, [initData]);

  useEffect(() => {
    fetchUserStatus();
    
    // Birinchi marta kirgan foydalanuvchiga qo'llanmani ko'rsatish
    const hideTutorial = localStorage.getItem('curweb_hide_tutorial');
    if (!hideTutorial) {
      setIsTutorialOpen(true);
    }
  }, [fetchUserStatus]);

  // 2. Ovozli buyruqlarni ijro etish (Direct or Forwarded)
  const executeCommandAction = useCallback((commandData) => {
    const { type, param } = commandData;
    console.log(`[Action Executor] Buyruq bajarilmoqda: ${type}`, param);

    switch (type) {
      case 'VOLUME_UP':
        if (mediaRef.current) {
          const newVol = Math.min(1.0, mediaRef.current.volume + 0.2);
          mediaRef.current.volume = newVol;
          setMediaVolume(newVol);
        }
        triggerHaptic('success');
        break;

      case 'VOLUME_DOWN':
        if (mediaRef.current) {
          const newVol = Math.max(0.0, mediaRef.current.volume - 0.2);
          mediaRef.current.volume = newVol;
          setMediaVolume(newVol);
        }
        triggerHaptic('success');
        break;

      case 'OPEN_YOUTUBE':
        window.open('https://youtube.com', '_blank');
        triggerHaptic('success');
        break;

      case 'OPEN_GALLERY':
        // Veb muqobili
        alert("Galereya ochildi (Simulyatsiya: Qurilma galereyasi native API orqali chaqiriladi).");
        triggerHaptic('success');
        break;

      case 'OPEN_INSTAGRAM':
        window.open('https://instagram.com', '_blank');
        triggerHaptic('success');
        break;

      case 'SCROLL_DOWN':
        simulatorRef.current.dispatchScroll(300);
        triggerHaptic('success');
        break;

      case 'SCROLL_UP':
        simulatorRef.current.dispatchScroll(-300);
        triggerHaptic('success');
        break;

      case 'TYPE_TEXT':
        // Fokuslangan inputga yozish
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          const start = activeEl.selectionStart;
          const end = activeEl.selectionEnd;
          const text = activeEl.value;
          activeEl.value = text.substring(0, start) + param + text.substring(end);
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (testInputRef.current) {
          // Dashboarddagi test maydonga yozish
          testInputRef.current.focus();
          testInputRef.current.value = param;
          testInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
        triggerHaptic('success');
        break;

      case 'SET_TIMER':
        const seconds = param.value * 60;
        setTimerText(`${param.value} minutli taymer o'rnatildi`);
        setTimerActive(true);
        triggerHaptic('success');
        setTimeout(() => {
          setTimerActive(false);
          setTimerText('Vaqt tugadi! (Taymer signali)');
          triggerHaptic('heavy');
        }, seconds * 1000);
        break;

      case 'BRIGHTNESS_OFF':
        // Ekran yorug'ligini kamaytirish simulyatsiyasi (Qorong'i overlay o'rnatish)
        setScreenBrightnessOverlay(0.6);
        triggerHaptic('success');
        break;

      case 'BRIGHTNESS_ON':
        // Ekran yorug'ligini yoqish
        setScreenBrightnessOverlay(0);
        triggerHaptic('success');
        break;

      case 'SCREENSHOT':
        alert("Skrinshot olindi va galereyaga saqlash jarayoni boshlandi (Native API simulyatsiyasi).");
        triggerHaptic('success');
        break;

      case 'OPEN_APP':
        alert(`"${param}" ilovasi ochilmoqda (Deep link / intent orqali)...`);
        triggerHaptic('success');
        break;

      case 'GO_BACK':
        window.history.back();
        triggerHaptic('success');
        break;

      case 'GO_HOME':
        alert("Bosh ekranga qaytish (Simulyatsiya: Home funksiyasi).");
        triggerHaptic('success');
        break;

      case 'MAKE_CALL':
        window.location.href = `tel:${param}`;
        triggerHaptic('success');
        break;

      case 'WIFI_TOGGLE':
        alert("Wi-Fi sozlamalari o'zgartirildi (Simulyatsiya).");
        triggerHaptic('success');
        break;

      default:
        console.warn(`Noma'lum buyruq harakati: ${type}`);
    }
  }, [triggerHaptic]);

  // 3. Ovozli buyruqlar kelganda
  const handleVoiceCommandDetected = useCallback(async (result) => {
    if (result.type === 'TIMEOUT' || result.type === 'UNKNOWN') {
      setLastVoiceCommand({ raw: result.raw || '', success: false, error: result.message });
      // Xatolik xabarini aytish (TTS) yoki vizual chiqarish
      const utterance = new SpeechSynthesisUtterance(result.message || "Bu buyruqni tushunmadim, qaytadan urinib ko'ring");
      utterance.lang = 'uz-UZ';
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (result.type === 'COMMAND') {
      const { command, type, param } = result;

      // Agar bepul rejimda bo'lsak va premium buyruq bo'lsa
      if (command.isPremium && userTier !== 'premium') {
        setLastVoiceCommand({ raw: result.raw, success: false, error: 'premium_required' });
        setIsUpgradeOpen(true);
        triggerHaptic('error');
        const utterance = new SpeechSynthesisUtterance("Bu buyruq Premium tarifda mavjud. Obunani faollashtirasizmi?");
        utterance.lang = 'uz-UZ';
        window.speechSynthesis.speak(utterance);
        return;
      }

      // Backend-ga log jo'natish va tarifni tekshirish
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (initData) headers['x-telegram-init-data'] = initData;

        const res = await fetch(`${SERVER_URL}/api/voice-command/execute`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ command: result.raw })
        });

        const resData = await res.json();
        
        if (!res.ok && resData.error === 'premium_required') {
          setIsUpgradeOpen(true);
          triggerHaptic('error');
          return;
        }
      } catch (err) {
        console.warn("Log yozishda xatolik yuz berdi (Offline rejim).");
      }

      setLastVoiceCommand({ raw: result.raw, success: true });

      // Controller bo'lsa, websocket orqali receiver-ga yo'naltiramiz
      if (appMode === 'controller' && socket) {
        socket.emit('voice-command', { type, param, raw: result.raw });
      } else {
        // Mahalliy yoki Receiver o'zida bo'lsa to'g'ridan-to'g'ri ijro qilamiz
        executeCommandAction({ type, param });
      }
    }
  }, [appMode, socket, userTier, initData, triggerHaptic, executeCommandAction]);

  // Voice recognition xukini ulash
  const { 
    isSupported: isVoiceSupported, 
    isListening: isVoiceListening, 
    activeState: voiceActiveState, 
    error: voiceError,
    startVoiceRecognition,
    stopVoiceRecognition
  } = useVoiceControl({
    onCommandDetected: handleVoiceCommandDetected,
    triggerHaptic
  });

  // 4. MediaPipe harakat nuqtalari kelganda (Vebkamera)
  const handleHandResults = useCallback((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Qo'l yo'qolganda kursorni yashirish va silliqlash filtrini tozalash
      setCursor(prev => ({ ...prev, visible: false }));
      mapperRef.current.reset();
      setCurrentGesture('idle');
      
      if (appMode === 'controller' && socket) {
        socket.emit('action', { type: 'pointer_hide' });
      }
      return;
    }

    const firstHand = results.multiHandLandmarks[0];
    
    // 1-bosqich: Imo-ishorani aniqlash
    const analysis = recognizerRef.current.recognizeSingleHand(firstHand);
    setCurrentGesture(analysis.gesture);

    // 2-bosqich: Kursor koordinatalarini olish
    if (analysis.point) {
      const screenPos = mapperRef.current.mapToScreen(analysis.point.x, analysis.point.y);
      setCursor({ x: screenPos.x, y: screenPos.y, visible: true });

      // 3-bosqich: Harakat yoki bosishlarni ijro etish yoki WebSocket orqali jo'natish
      if (appMode === 'controller' && socket) {
        socket.emit('action', {
          type: 'gesture_update',
          cursor: { x: screenPos.x, y: screenPos.y, visible: true },
          gesture: analysis.gesture,
          extra: { direction: analysis.direction, deltaY: analysis.deltaY }
        });
      } else {
        // Local ijro
        if (analysis.gesture === 'pointer_move') {
          simulatorRef.current.dispatchMove(screenPos.x, screenPos.y);
        } else if (analysis.gesture === 'pinch') {
          simulatorRef.current.dispatchClick(screenPos.x, screenPos.y);
          triggerHaptic('light');
        } else if (analysis.gesture === 'scroll' && analysis.direction) {
          simulatorRef.current.dispatchScroll(analysis.deltaY);
        } else if (analysis.gesture === 'fist') {
          simulatorRef.current.dispatchLongPress(screenPos.x, screenPos.y);
          triggerHaptic('heavy');
        }
      }
    }
  }, [appMode, socket, triggerHaptic]);

  // Hand tracking xuki
  const {
    isActive: isCameraActive,
    error: cameraError,
    fps: cameraFps,
    videoRef,
    canvasRef,
    startTracking: startCamera,
    stopTracking: stopCamera
  } = useHandTracking(handleHandResults);

  // 5. Receiver WebSocket sozlamalari (PIN yaratish)
  const initializeReceiverSession = async () => {
    setPairingStatus('pending');
    try {
      const res = await fetch(`${SERVER_URL}/api/session/create`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setPairingPin(data.pin);

        // Socket.io ulanish
        const newSocket = io(SERVER_URL, {
          auth: { token: data.token }
        });

        newSocket.on('peer_connected', (peer) => {
          console.log(`[Receiver] Controller bog'landi:`, peer);
          setPairingStatus('paired');
          triggerHaptic('success');
        });

        newSocket.on('peer_disconnected', () => {
          console.log(`[Receiver] Controller uzildi.`);
          setPairingStatus('pending');
        });

        // Controller-dan keladigan virtual harakatlarni qabul qilish
        newSocket.on('action', (actionData) => {
          if (actionData.type === 'pointer_hide') {
            setCursor(prev => ({ ...prev, visible: false }));
          } else if (actionData.type === 'gesture_update') {
            const { cursor: peerCursor, gesture: peerGesture, extra } = actionData;
            setCursor(peerCursor);
            setCurrentGesture(peerGesture);

            if (peerGesture === 'pointer_move') {
              simulatorRef.current.dispatchMove(peerCursor.x, peerCursor.y);
            } else if (peerGesture === 'pinch') {
              simulatorRef.current.dispatchClick(peerCursor.x, peerCursor.y);
            } else if (peerGesture === 'scroll' && extra.direction) {
              simulatorRef.current.dispatchScroll(extra.deltaY);
            } else if (peerGesture === 'fist') {
              simulatorRef.current.dispatchLongPress(peerCursor.x, peerCursor.y);
            }
          }
        });

        // Controller-dan keladigan ovozli buyruqlarni qabul qilish
        newSocket.on('voice-command', (voiceData) => {
          executeCommandAction(voiceData);
        });

        setSocket(newSocket);
      }
    } catch (err) {
      console.error(err);
      setPairingStatus('error');
    }
  };

  // 6. Controller WebSocket sozlamalari (PIN kiritish)
  const handleControllerPairing = async () => {
    if (!inputPin) return;
    setPairingStatus('pending');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (initData) headers['x-telegram-init-data'] = initData;

      const res = await fetch(`${SERVER_URL}/api/session/pair`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pin: inputPin })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSessionId(data.sessionId);
        
        // Socket.io ulanish
        const newSocket = io(SERVER_URL, {
          auth: { token: data.token }
        });

        newSocket.on('connect', () => {
          setPairingStatus('paired');
          triggerHaptic('success');
          // Avtomatik kamera va ovozli boshqaruvni yoqish
          startCamera();
          startVoiceRecognition();
        });

        newSocket.on('peer_disconnected', () => {
          setPairingStatus('pending');
        });

        setSocket(newSocket);
      } else {
        alert(data.error || "PIN kod noto'g'ri yoki muddati tugagan.");
        setPairingStatus('error');
      }
    } catch (err) {
      console.error(err);
      setPairingStatus('error');
    }
  };

  // Ulanish tozalashlar
  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    stopCamera();
    stopVoiceRecognition();
    setPairingStatus('idle');
    setPairingPin('');
    setSessionId('');
    setCursor({ x: 0, y: 0, visible: false });
  };

  return (
    <div className="app-container">
      {/* 1. Ekran yorqinligi overlay (yorug'likni o'chirish buyrug'i uchun) */}
      {screenBrightnessOverlay > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          opacity: screenBrightnessOverlay,
          pointerEvents: 'none',
          zIndex: 999999,
          transition: 'opacity 0.8s ease'
        }} />
      )}

      {/* 2. Virtual kursor vizual qatlami */}
      <CursorOverlay cursor={cursor} gesture={currentGesture} multitouchPoints={multitouchPoints} />

      {/* 3. Header panel */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 10, 15, 0.4)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            CurWeb
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TierBadge tier={userTier} onClick={() => setIsUpgradeOpen(true)} />
          <button
            onClick={() => setIsTutorialOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 4. Asosiy Content maydoni */}
      <main style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* App mode selector */}
        {pairingStatus === 'idle' && (
          <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ishlash rejimini tanlang
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setAppMode('local')}
                className={appMode === 'local' ? 'btn-glow' : 'btn-secondary'}
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Smartphone className="w-5 h-5" />
                <span>Yagona Qurilma (Local)</span>
              </button>

              <button
                onClick={() => setAppMode('pairing')}
                className={appMode === 'pairing' ? 'btn-glow' : 'btn-secondary'}
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Monitor className="w-5 h-5" />
                <span>Sessiya Pair (Pult)</span>
              </button>
            </div>
          </div>
        )}

        {/* Pairing Mode UI */}
        {appMode === 'pairing' && pairingStatus === 'idle' && (
          <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Pairing Ulanish</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Kompyuterda ushbu sahifani ochib, <strong>"Receiver (Qabul qiluvchi)"</strong> deb tanlang,
                so'ngra olingan kodni bu yerga kiriting:
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="6 xonali PIN kod"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '700',
                    letterSpacing: '2px',
                    outline: 'none'
                  }}
                />
                <button className="btn-glow" onClick={handleControllerPairing} style={{ padding: '0 20px' }}>
                  Ulanish
                </button>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Yoki ushbu qurilmani qabul qiluvchi (Receiver) sifatida ishlatmoqchimisiz?
              </p>
              <button className="btn-secondary" onClick={() => {
                setAppMode('receiver');
                initializeReceiverSession();
              }}>
                Receiver rejimini yoqish
              </button>
            </div>
          </div>
        )}

        {/* Pairing Status panel */}
        {pairingStatus !== 'idle' && (
          <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ulanish holati:</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: pairingStatus === 'paired' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: pairingStatus === 'paired' ? 'var(--success)' : 'var(--warning)',
                fontWeight: '600'
              }}>
                {pairingStatus === 'paired' ? 'Ulangan' : 'Kutilmoqda...'}
              </span>
            </div>

            {appMode === 'receiver' && pairingPin && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bog'lanish uchun PIN kod:</span>
                <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '4px', marginTop: '6px' }}>
                  {pairingPin}
                </h2>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Kodni mobil telefondagi CurWeb ilovasiga kiriting.
                </p>
              </div>
            )}

            <button className="btn-secondary" onClick={handleDisconnect} style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
              Ulanishni uzish
            </button>
          </div>
        )}

        {/* Taymer Banner (Agar faol bo'lsa) */}
        {timerActive && (
          <div className="glass" style={{
            padding: '12px 16px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'rgba(16, 185, 129, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '12px'
          }}>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div style={{ fontSize: '13px' }}>{timerText}</div>
          </div>
        )}

        {/* Ovozli indikator */}
        {appMode !== 'receiver' && (
          <VoiceIndicator 
            isSupported={isVoiceSupported}
            isListening={isVoiceListening}
            activeState={voiceActiveState}
            lastCommand={lastVoiceCommand}
            error={voiceError}
            onToggle={() => {
              if (isVoiceListening) {
                stopVoiceRecognition();
              } else {
                startVoiceRecognition();
              }
            }}
          />
        )}

        {/* Demo elementlar va Sandbox test maydoni (Faqat receiver va local rejimlar uchun) */}
        {appMode !== 'controller' && (
          <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Sinov va Sandbox Maydoni</h3>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Ushbu maydondagi tugmalarni sensor yoki ovoz orqali bosib test qiling.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Test tugmasi */}
              <button 
                id="sandbox-test-btn"
                onClick={() => {
                  triggerHaptic('success');
                  alert("Muvaffaqiyatli click simulyatsiyasi!");
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Test Click Tugmasi
              </button>

              {/* Ovoz sinovi uchun audio pleer */}
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.03)',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Media Ovoz sinovi:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <audio 
                    ref={mediaRef} 
                    src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
                    controls 
                    style={{ width: '160px', height: '30px' }}
                  />
                </div>
              </div>

              {/* Matn yozish testi uchun input */}
              <input
                ref={testInputRef}
                type="text"
                placeholder="Bu yerga ovoz bilan matn kiriting..."
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* 5. Kamera PiP overlay (Faqat controller va local uchun) */}
      {appMode !== 'receiver' && (
        <CameraPiP 
          videoRef={videoRef}
          canvasRef={canvasRef}
          isActive={isCameraActive}
          fps={cameraFps}
          error={cameraError}
          onStart={startCamera}
          onStop={stopCamera}
        />
      )}

      {/* 6. Modallar */}
      <TutorialModal 
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onTrySandbox={() => {
          setIsTutorialOpen(false);
          if (appMode !== 'receiver') {
            startCamera();
            startVoiceRecognition();
          }
        }}
      />

      <UpgradeModal 
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onUpgradeSuccess={(tier, expires) => {
          setUserTier(tier);
          setSubExpiresAt(expires);
          triggerHaptic('success');
          alert("Siz muvaffaqiyatli Premium foydalanuvchiga aylandingiz! 👑");
        }}
      />
    </div>
  );
}
