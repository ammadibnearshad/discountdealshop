/* DDS savings strip
 *
 * Cycles the promise items one at a time on small screens. The stacked layout
 * and the cross-fade live in section-dds-savings-bar.css so they are right on
 * first paint; this element only decides when to advance.
 *
 * Rotation is skipped on wide screens and under prefers-reduced-motion — in
 * both cases the CSS shows every promise in a scrollable row instead, so no
 * promise is ever unreachable.
 */

if (!customElements.get('dds-savings-bar')) {
  class DdsSavingsBar extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('[data-savings-items]');
      if (!this.list) return;

      this.items = Array.from(this.list.children);
      if (this.items.length < 2) return;

      this.index = this.items.findIndex((item) => item.classList.contains('dds-savings__item--active'));
      if (this.index < 0) this.index = 0;

      this.timer = null;
      this.smallScreen = window.matchMedia('(max-width: 749px)');
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.onContextChange = this.sync.bind(this);
      this.onVisibilityChange = this.handleVisibilityChange.bind(this);

      this.smallScreen.addEventListener('change', this.onContextChange);
      this.reducedMotion.addEventListener('change', this.onContextChange);
      document.addEventListener('visibilitychange', this.onVisibilityChange);

      this.sync();
    }

    disconnectedCallback() {
      this.stop();
      if (!this.smallScreen) return;

      this.smallScreen.removeEventListener('change', this.onContextChange);
      this.reducedMotion.removeEventListener('change', this.onContextChange);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    get shouldRotate() {
      return this.smallScreen.matches && !this.reducedMotion.matches;
    }

    sync() {
      if (this.shouldRotate) {
        this.start();
      } else {
        this.stop();
      }
    }

    show(i) {
      this.index = (i + this.items.length) % this.items.length;
      this.items.forEach((item, n) => item.classList.toggle('dds-savings__item--active', n === this.index));
    }

    start() {
      if (this.timer || document.hidden) return;

      const speed = (parseFloat(this.dataset.rotateSpeed) || 3) * 1000;
      this.timer = setInterval(() => this.show(this.index + 1), speed);
    }

    stop() {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Don't burn a timer in a backgrounded tab on a mid-range phone.
    handleVisibilityChange() {
      if (document.hidden) {
        this.stop();
      } else {
        this.sync();
      }
    }
  }

  customElements.define('dds-savings-bar', DdsSavingsBar);
}
