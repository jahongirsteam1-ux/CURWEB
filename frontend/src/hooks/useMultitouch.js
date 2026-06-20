import { useRef, useCallback } from 'react';

/**
 * Ikki qo'ldan olingan nuqtalar asosida multitouch (zoom / pan)
 * harakatlarini simulyatsiya qilish uchun React Hook.
 */
export function useMultitouch() {
  const lastDistanceRef = useRef(null);
  const zoomFactorRef = useRef(1);

  const processMultitouch = useCallback((hand1Landmarks, hand2Landmarks, callback) => {
    if (!hand1Landmarks || !hand2Landmarks || hand1Landmarks.length < 21 || hand2Landmarks.length < 21) {
      lastDistanceRef.current = null;
      return;
    }

    // Har bir qo'lning ko'rsatkich barmog'i uchi (Landmark 8)
    const p1 = hand1Landmarks[8];
    const p2 = hand2Landmarks[8];

    // Ikki barmoq orasidagi 2D masofa
    const currentDistance = Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2)
    );

    // O'rtadagi markaziy nuqta (pan uchun)
    const center = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };

    if (lastDistanceRef.current !== null) {
      const delta = currentDistance - lastDistanceRef.current;
      
      // Sezgirlik chegarasi
      if (Math.abs(delta) > 0.01) {
        // Agar masofa kengaygan bo'lsa - ZOOM IN, qisqargan bo'lsa - ZOOM OUT
        const scaleChange = delta * 5; // Masshtab koeffitsiyenti
        zoomFactorRef.current = Math.max(0.5, Math.min(3.0, zoomFactorRef.current + scaleChange));

        if (callback) {
          callback({
            zoomFactor: zoomFactorRef.current,
            center,
            delta,
            action: delta > 0 ? 'zoom_in' : 'zoom_out'
          });
        }
      }
    }

    lastDistanceRef.current = currentDistance;
  }, []);

  const resetMultitouch = useCallback(() => {
    lastDistanceRef.current = null;
  }, []);

  return {
    processMultitouch,
    resetMultitouch,
    zoomFactor: zoomFactorRef.current
  };
}
export default useMultitouch;
