/**
 * Koordinatalarni normalizatsiyalangan formatdan (0-1) ekran o'lchamlariga o'tkazish
 * va siljishlarni silliqlash (Exponential Moving Average) algoritmini qo'llash.
 */
class CoordinateMapper {
  constructor(alpha = 0.25) {
    this.alpha = alpha; // Silliqlash koeffitsiyenti (0.1 - 0.3 oralig'ida)
    this.smoothedX = null;
    this.smoothedY = null;
  }

  /**
   * Yangi kelgan x va y koordinatalarni silliqlaydi
   */
  smooth(x, y) {
    if (this.smoothedX === null || this.smoothedY === null) {
      this.smoothedX = x;
      this.smoothedY = y;
    } else {
      this.smoothedX = this.alpha * x + (1 - this.alpha) * this.smoothedX;
      this.smoothedY = this.alpha * y + (1 - this.alpha) * this.smoothedY;
    }
    return { x: this.smoothedX, y: this.smoothedY };
  }

  /**
   * Normalizatsiya qilingan koordinatalarni ekran (viewport) o'lchamlariga map qiladi.
   * MediaPipe kameradan teskari (mirror) olingani sababli X o'qini teskari qilamiz (1 - x).
   */
  mapToScreen(x, y, mirror = true) {
    const targetX = mirror ? 1 - x : x;
    const targetY = y;

    // Koordinatalarni silliqlaymiz
    const smoothed = this.smooth(targetX, targetY);

    // Ekranning joriy o'lchamlari
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    return {
      x: Math.round(smoothed.x * screenWidth),
      y: Math.round(smoothed.y * screenHeight)
    };
  }

  /**
   * Silliqlash tarixini tozalash (masalan, qo'l ekrandan chiqqanda)
   */
  reset() {
    this.smoothedX = null;
    this.smoothedY = null;
  }
}

export default CoordinateMapper;
