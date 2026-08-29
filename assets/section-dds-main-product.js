/* DDS main product
 *
 * Two small custom elements. Variant switching, price re-rendering and the
 * add-to-cart itself are all Dawn's (<product-info>, <variant-selects>,
 * <product-form>) — nothing here duplicates that.
 */

/* Gallery counter. The stage is a CSS scroll-snap track; this only keeps the
   "2/5" pill honest as the customer swipes. */
if (!customElements.get('dds-gallery')) {
  class DdsGallery extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-gallery-track]');
      this.output = this.querySelector('[data-gallery-index]');
      if (!this.track || !this.output) return;

      this.onScroll = this.handleScroll.bind(this);
      this.track.addEventListener('scroll', this.onScroll, { passive: true });
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
    }

    handleScroll() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (!this.track.clientWidth) return;
        const index = Math.round(this.track.scrollLeft / this.track.clientWidth) + 1;
        this.output.textContent = index;
      }, 90);
    }
  }

  customElements.define('dds-gallery', DdsGallery);
}

/* Sale countdown. Counts down to the real end date set on the block in the
   theme editor (optionally overridden per product by custom.sale_ends_at). The
   section renders nothing at all when that date is empty or already past, so
   this never invents a deadline. */
if (!customElements.get('dds-countdown')) {
  class DdsCountdown extends HTMLElement {
    connectedCallback() {
      this.output = this.querySelector('[data-countdown-time]');
      this.bar = this.querySelector('[data-countdown-bar]');
      if (!this.output) return;

      this.endsAt = Date.parse(this.dataset.endsAt);
      if (Number.isNaN(this.endsAt)) {
        this.hidden = true;
        return;
      }

      this.startedAt = Date.now();
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }

    disconnectedCallback() {
      clearInterval(this.timer);
    }

    tick() {
      const remaining = this.endsAt - Date.now();

      if (remaining <= 0) {
        clearInterval(this.timer);
        this.hidden = true;
        return;
      }

      const pad = (n) => String(n).padStart(2, '0');
      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      this.output.textContent = days > 0
        ? `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

      // Progress across the window this page view has observed, capped so the
      // bar never reads as fuller than the time actually elapsed.
      if (this.bar) {
        const window_ = this.endsAt - this.startedAt;
        const elapsed = Date.now() - this.startedAt;
        const pct = window_ > 0 ? Math.min(100, (elapsed / window_) * 100) : 0;
        this.bar.style.width = `${100 - pct}%`;
      }
    }
  }

  customElements.define('dds-countdown', DdsCountdown);
}
