/* DDS rotator
 *
 * Shows one child at a time on small screens, cross-fading upward. Shared by
 * the savings strip and the collection trust bar.
 *
 * The stacked layout and the fade live in dds-rotator.css so they are correct
 * on first paint; this element only decides when to advance.
 *
 * Rotation is skipped on wide screens and under prefers-reduced-motion — in
 * both cases the CSS shows every item in a scrollable row instead, so nothing
 * is ever unreachable.
 *
 * Markup:
 *   <dds-rotator data-rotate-speed="3">
 *     <ul class="dds-rotator__track" data-rotator-items>
 *       <li class="is-active">…</li>
 *       <li>…</li>
 *     </ul>
 *   </dds-rotator>
 */

if (!customElements.get('dds-rotator')) {
  class DdsRotator extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-rotator-items]');
      if (!this.track) return;

      this.items = Array.from(this.track.children);
      if (this.items.length < 2) return;

      this.index = this.items.findIndex((item) => item.classList.contains('is-active'));
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
      this.items.forEach((item, n) => item.classList.toggle('is-active', n === this.index));
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

  customElements.define('dds-rotator', DdsRotator);
}
