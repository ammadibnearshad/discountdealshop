/* DDS main product
 *
 * Three small custom elements. Variant switching, price re-rendering and the
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

/* Sale countdown. Counts down to a real end date from the product's
   custom.sale_ends_at metafield — the section renders nothing at all when that
   metafield is empty, so this never invents a deadline. */
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

/* City delivery estimate. Each option's value is the day range, so switching
   city rewrites the estimate line without a request. */
if (!customElements.get('dds-delivery-estimate')) {
  class DdsDeliveryEstimate extends HTMLElement {
    connectedCallback() {
      this.select = this.querySelector('[data-city-select]');
      this.days = this.querySelector('[data-city-days]');
      this.city = this.querySelector('[data-city-name]');
      if (!this.select || !this.days || !this.city) return;

      this.onChange = this.update.bind(this);
      this.select.addEventListener('change', this.onChange);

      // Remember the shopper's city between visits — it rarely changes.
      try {
        const saved = localStorage.getItem('dds-city');
        if (saved && [...this.select.options].some((o) => o.text === saved)) {
          this.select.value = [...this.select.options].find((o) => o.text === saved).value;
          this.select.selectedIndex = [...this.select.options].findIndex((o) => o.text === saved);
        }
      } catch (e) {
        /* private mode, blocked storage — fall through to the default city */
      }

      this.update();
    }

    disconnectedCallback() {
      if (this.select) this.select.removeEventListener('change', this.onChange);
    }

    update() {
      const option = this.select.options[this.select.selectedIndex];
      if (!option) return;

      this.days.textContent = option.value;
      this.city.textContent = option.text;

      try {
        localStorage.setItem('dds-city', option.text);
      } catch (e) {
        /* nothing to do — the estimate still shows, it just is not remembered */
      }
    }
  }

  customElements.define('dds-delivery-estimate', DdsDeliveryEstimate);
}
