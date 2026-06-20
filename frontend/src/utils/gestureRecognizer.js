/**
 * MediaPipe Hands landmarks ma'lumotlarini tahlil qilib,
 * tegishli imo-ishoralarni (gestures) aniqlovchi klass.
 */
class GestureRecognizer {
  constructor() {
    this.pinchThreshold = 0.05; // Pinch masofasi chegarasi
    this.scrollThreshold = 0.12; // Skrol qilish uchun masofa siljishi
    this.lastPalmY = null;
    this.dragActive = false;
    this.fistTimer = 0;
  }

  /**
   * Ikki nuqta o'rtasidagi masofani hisoblash (Euclidean distance)
   */
  getDistance(p1, p2) {
    if (!p1 || !p2) return 999;
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow(p1.z - p2.z, 2)
    );
  }

  /**
   * Bitta qo'l imo-ishorasini aniqlash
   * landmarks - 21 ta nuqtadan iborat massiv
   */
  recognizeSingleHand(landmarks) {
    if (!landmarks || landmarks.length < 21) return { gesture: 'idle' };

    // Barmoq uchlari va bo'g'inlari
    const wrist = landmarks[0];
    
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    
    const middleTip = landmarks[12];
    const middlePIP = landmarks[10];
    
    const ringTip = landmarks[16];
    const ringPIP = landmarks[14];
    
    const pinkyTip = landmarks[20];
    const pinkyPIP = landmarks[18];

    // Barmoqlar ochiqlik (yozilganlik) holatlari
    // Y-o'qi yuqoriga qarab kamayadi (0.0 tepada, 1.0 pastda)
    const isIndexExtended = indexTip.y < indexPIP.y;
    const isMiddleExtended = middleTip.y < middlePIP.y;
    const isRingExtended = ringTip.y < ringPIP.y;
    const isPinkyExtended = pinkyTip.y < pinkyPIP.y;

    // Bosh barmoq ochiqligini uning index barmoq bo'g'inidan masofasiga qarab aniqlaymiz
    const thumbDistance = this.getDistance(thumbTip, landmarks[5]);
    const isThumbExtended = thumbDistance > 0.08;

    // 1. Musht (Fist / Long Press) - barcha barmoqlar bukilgan bo'lsa
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'fist', point: wrist };
    }

    // 2. Ochiq Kaft (Open Palm / Scroll) - barcha barmoqlar ochiq bo'lsa
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      // Skrol yo'nalishini aniqlash (Kaft markazi siljishi)
      const palmCenterY = landmarks[9].y;
      let scrollDirection = null;
      let scrollDelta = 0;

      if (this.lastPalmY !== null) {
        const diff = palmCenterY - this.lastPalmY;
        if (Math.abs(diff) > 0.015) { // Sezgirlik
          scrollDirection = diff > 0 ? 'down' : 'up';
          scrollDelta = diff * 800; // Skrol tezligini moslash
        }
      }
      this.lastPalmY = palmCenterY;

      return { 
        gesture: 'scroll', 
        direction: scrollDirection, 
        deltaY: scrollDelta,
        point: landmarks[9] 
      };
    } else {
      // Skrol holati to'xtagani uchun palmY ni tozalaymiz
      this.lastPalmY = null;
    }

    // 3. Pinch / Click (Index + Thumb) - ko'rsatkich va bosh barmoq birlashsa
    const pinchDistance = this.getDistance(thumbTip, indexTip);
    const isPinching = pinchDistance < this.pinchThreshold;

    if (isPinching) {
      // Agar boshqa barmoqlar yozilgan bo'lsa, drag/swipe yoki click rejimiga kiradi
      return {
        gesture: 'pinch',
        point: {
          x: (thumbTip.x + indexTip.x) / 2,
          y: (thumbTip.y + indexTip.y) / 2,
          z: (thumbTip.z + indexTip.z) / 2
        },
        distance: pinchDistance
      };
    }

    // 4. Cursor harakati (Pointer Move) - Faqat ko'rsatkich barmoq ochiq bo'lsa
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'pointer_move', point: indexTip };
    }

    return { gesture: 'idle', point: indexTip };
  }

  /**
   * Ikki qo'lni birgalikda kuzatib multitouch gesture aniqlash (Zoom / Pan)
   */
  recognizeMultiHand(handsLandmarks) {
    if (!handsLandmarks || handsLandmarks.length < 2) return null;

    const hand1 = handsLandmarks[0];
    const hand2 = handsLandmarks[1];

    // Ikkala qo'lning ham ko'rsatkich barmog'i uchini olamiz (Landmark 8)
    const index1 = hand1[8];
    const index2 = hand2[8];

    // Ikki barmoq uchi orasidagi masofa
    const currentDistance = this.getDistance(index1, index2);

    // O'rtadagi markaziy nuqta (Pan uchun)
    const centerPoint = {
      x: (index1.x + index2.x) / 2,
      y: (index1.y + index2.y) / 2
    };

    return {
      gesture: 'multitouch',
      distance: currentDistance,
      center: centerPoint
    };
  }
}

export default GestureRecognizer;
