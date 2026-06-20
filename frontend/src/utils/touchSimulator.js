/**
 * Sintetik touch va pointer hodisalarini (Pointer Events / Touch Events API)
 * DOM elementlariga uzatuvchi touchSimulator klassi.
 */
class TouchSimulator {
  constructor() {
    this.activePointerId = 1;
    this.lastTarget = null;
  }

  /**
   * Berilgan koordinatalardagi elementni topadi
   */
  getElementAt(x, y) {
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
      return null;
    }
    return document.elementFromPoint(x, y);
  }

  /**
   * Pointer harakatlanish hodisasini jo'natish
   */
  dispatchMove(x, y) {
    const target = this.getElementAt(x, y);
    if (!target) return;

    // PointerEnter va PointerLeave hodisalarini boshqarish
    if (this.lastTarget && this.lastTarget !== target) {
      this.dispatchEvent('pointerout', this.lastTarget, x, y);
      this.dispatchEvent('pointerleave', this.lastTarget, x, y);
      this.dispatchEvent('pointerover', target, x, y);
      this.dispatchEvent('pointerenter', target, x, y);
    }
    this.lastTarget = target;

    this.dispatchEvent('pointermove', target, x, y);
  }

  /**
   * Click/Tap hodisasini jo'natish
   */
  dispatchClick(x, y) {
    const target = this.getElementAt(x, y);
    if (!target) return;

    // 1. Pointer Down
    this.dispatchEvent('pointerdown', target, x, y, { button: 0, buttons: 1 });
    this.dispatchTouchEvent('touchstart', target, x, y);

    // 2. Focus berish
    if (typeof target.focus === 'function') {
      target.focus();
    }

    // 3. Pointer Up
    setTimeout(() => {
      this.dispatchEvent('pointerup', target, x, y, { button: 0, buttons: 0 });
      this.dispatchTouchEvent('touchend', target, x, y);
      
      // 4. Click
      const clickEvent = new MouseEvent('click', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window
      });
      target.dispatchEvent(clickEvent);
      
      console.log(`[Simulator] Click yuborildi:`, target.tagName, target.id || target.className);
    }, 80);
  }

  /**
   * Drag qilish boshlanishi (PointerDown)
   */
  dispatchDragStart(x, y) {
    const target = this.getElementAt(x, y);
    if (!target) return;
    this.dispatchEvent('pointerdown', target, x, y, { button: 0, buttons: 1 });
    this.dispatchTouchEvent('touchstart', target, x, y);
  }

  /**
   * Drag jarayoni (PointerMove)
   */
  dispatchDragMove(x, y) {
    const target = this.getElementAt(x, y) || this.lastTarget;
    if (!target) return;
    this.dispatchEvent('pointermove', target, x, y, { button: 0, buttons: 1 });
    this.dispatchTouchEvent('touchmove', target, x, y);
  }

  /**
   * Drag tugashi (PointerUp)
   */
  dispatchDragEnd(x, y) {
    const target = this.getElementAt(x, y) || this.lastTarget;
    if (!target) return;
    this.dispatchEvent('pointerup', target, x, y, { button: 0, buttons: 0 });
    this.dispatchTouchEvent('touchend', target, x, y);
  }

  /**
   * Skrol qilish (Scroll)
   */
  dispatchScroll(deltaY) {
    window.scrollBy({
      top: deltaY,
      left: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Long press (Uzoq bosib turish)
   */
  dispatchLongPress(x, y) {
    const target = this.getElementAt(x, y);
    if (!target) return;

    this.dispatchEvent('pointerdown', target, x, y, { button: 0, buttons: 1 });
    
    setTimeout(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window
      });
      target.dispatchEvent(contextMenuEvent);
      this.dispatchEvent('pointerup', target, x, y, { button: 0, buttons: 0 });
      console.log(`[Simulator] Long Press yuborildi:`, target.tagName);
    }, 600);
  }

  /**
   * Umumiy PointerEvent jo'natuvchi yordamchi funksiya
   */
  dispatchEvent(type, element, x, y, extraParams = {}) {
    try {
      const event = new PointerEvent(type, {
        pointerId: this.activePointerId,
        pointerType: 'mouse',
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window,
        ...extraParams
      });
      element.dispatchEvent(event);
    } catch (e) {
      console.error(`PointerEvent jo'natishda xato (${type}):`, e);
    }
  }

  /**
   * TouchEvent ob'ektini yaratuvchi va jo'natuvchi funksiya (Brauzer xavfsizligi hisobga olingan)
   */
  dispatchTouchEvent(type, element, x, y) {
    try {
      let touchObj;
      
      // Touch konstruktori ba'zi brauzerlarda cheklangan bo'lishi mumkin
      if (typeof window.Touch === 'function') {
        touchObj = new Touch({
          identifier: this.activePointerId,
          target: element,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          pageX: x + window.scrollX,
          pageY: y + window.scrollY
        });
      } else {
        // Fallback
        touchObj = {
          identifier: this.activePointerId,
          target: element,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          pageX: x + window.scrollX,
          pageY: y + window.scrollY
        };
      }

      const touchEvent = new TouchEvent(type, {
        touches: [touchObj],
        targetTouches: [touchObj],
        changedTouches: [touchObj],
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(touchEvent);
    } catch (e) {
      // Agar TouchEvent dispatch qilib bo'lmasa, Pointer yoki MouseEvent yetarli bo'ladi
    }
  }
}

export default TouchSimulator;
