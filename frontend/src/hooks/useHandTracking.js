import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * MediaPipe Hands yordamida qo'llarni real vaqtda kuzatuvchi hook.
 * CDN orqali yuklangan window.Hands va window.Camera kutubxonalaridan foydalanadi.
 */
export function useHandTracking(onResultsCallback) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  
  const lastFrameTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(0);

  // Qo'l skeletini canvas-da chizish logikasi
  const drawHandSkeleton = useCallback((ctx, landmarks) => {
    // MediaPipe Hands ulanish nuqtalari
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17]             // Palm base
    ];

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Chiziqlarni chizish (vibrant gradient)
    ctx.strokeStyle = '#a855f7'; // Purple
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    connections.forEach(([i1, i2]) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2) {
        ctx.beginPath();
        // Mirror effekt bo'lgani uchun X o'qini teskari qilamiz: (1 - x)
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      }
    });

    // Bo'g'in nuqtalarini chizish
    landmarks.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc((1 - p.x) * width, p.y * height, idx === 8 || idx === 4 ? 6 : 4, 0, 2 * Math.PI);
      
      if (idx === 8 || idx === 4) {
        ctx.fillStyle = '#6366f1'; // Indigo barmoq uchi
      } else {
        ctx.fillStyle = '#f8fafc'; // Oq bo'g'inlar
      }
      ctx.fill();
    });
  }, []);

  const startTracking = useCallback(async () => {
    if (isActive) return;

    if (!window.Hands || !window.Camera) {
      setError("MediaPipe kutubxonalari yuklanmadi. Sahifani qayta yuklang.");
      return;
    }

    try {
      setError(null);
      
      // EXPLICIT PERMISSION REQUEST: Telegram iOS WebApp ko'pincha ruxsatlarni to'g'ri so'ramaydi
      // Shuning uchun MediaPipe-dan oldin o'zimiz majburiy so'raymiz
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Streamni darhol yopamiz, chunki MediaPipe o'zi yana ochadi
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr) {
        throw new Error("PERMISSION_DENIED");
      }

      // 1. MediaPipe Hands obyektini sozlash
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
      });

      // Natijalar kelganda
      hands.onResults((results) => {
        // FPS hisoblash
        const now = performance.now();
        frameCountRef.current++;
        if (now - fpsTimerRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (now - fpsTimerRef.current)));
          frameCountRef.current = 0;
          fpsTimerRef.current = now;
        }

        // Canvas-ni tozalash va chizish
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            results.multiHandLandmarks.forEach((landmarks) => {
              drawHandSkeleton(ctx, landmarks);
            });
          }
        }

        // Callback-ga jo'natish
        if (onResultsCallback) {
          onResultsCallback(results);
        }
      });

      handsInstanceRef.current = hands;

      // 2. Kamerani ishga tushirish
      if (videoRef.current) {
        const video = videoRef.current;
        const camera = new window.Camera(video, {
          onFrame: async () => {
            if (handsInstanceRef.current && video.readyState >= 2) {
              await handsInstanceRef.current.send({ image: video });
            }
          },
          width: 320,
          height: 240
        });

        await camera.start();
        cameraInstanceRef.current = camera;
        setIsActive(true);
      }
    } catch (err) {
      console.error("Kamerani ochishda xatolik:", err);
      if (err.message === "PERMISSION_DENIED" || err.name === "NotAllowedError") {
        setError("Kameraga ruxsat yo'q. Telegram yuqori o'ng burchagidagi 3 nuqtani bosib, 'Brauzerda ochish' (Open in Browser) ni tanlang.");
      } else {
        setError("Kameraga ulanib bo'lmadi. Ruxsat berilganligini tekshiring.");
      }
      setIsActive(false);
    }
  }, [isActive, onResultsCallback, drawHandSkeleton]);

  const stopTracking = useCallback(() => {
    if (!isActive) return;

    try {
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
        cameraInstanceRef.current = null;
      }
      
      if (handsInstanceRef.current) {
        handsInstanceRef.current.close();
        handsInstanceRef.current = null;
      }

      setIsActive(false);
      setFps(0);
      
      // Canvas-ni tozalash
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch (err) {
      console.error("Kamerani to'xtatishda xatolik:", err);
    }
  }, [isActive]);

  // Hook unmount bo'lganda tozalash
  useEffect(() => {
    return () => {
      if (cameraInstanceRef.current) cameraInstanceRef.current.stop();
      if (handsInstanceRef.current) handsInstanceRef.current.close();
    };
  }, []);

  return {
    isActive,
    error,
    fps,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking
  };
}
