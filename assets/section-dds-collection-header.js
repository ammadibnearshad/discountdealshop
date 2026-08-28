/* DDS collection description read-more
 *
 * The description is clamped by CSS to the section's line count. This element
 * only reveals the toggle when the text actually overflows that clamp, so a
 * two-line description never gets a pointless "Read more".
 */

if (!customElements.get('dds-readmore')) {
  class DdsReadMore extends HTMLElement {
    connectedCallback() {
      this.body = this.querySelector('[data-readmore-body]');
      this.toggle = this.querySelector('[data-readmore-toggle]');
      if (!this.body || !this.toggle) return;

      this.onToggle = this.handleToggle.bind(this);
      this.onResize = this.handleResize.bind(this);

      this.toggle.addEventListener('click', this.onToggle);
      window.addEventListener('resize', this.onResize);

      // Fonts land after first paint and change the measurement.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this.measure());
      }

      this.measure();
    }

    disconnectedCallback() {
      clearTimeout(this.resizeTimer);
      if (this.toggle) this.toggle.removeEventListener('click', this.onToggle);
      window.removeEventListener('resize', this.onResize);
    }

    measure() {
      // Never hide the toggle while the text is open — that would strand the
      // reader with no way to collapse it.
      if (this.classList.contains('is-open')) return;

      const overflows = this.body.scrollHeight - this.body.clientHeight > 1;
      this.toggle.hidden = !overflows;
    }

    handleToggle() {
      const open = this.classList.toggle('is-open');
      this.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.toggle.textContent = open ? this.toggle.dataset.labelLess : this.toggle.dataset.labelMore;
    }

    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.measure(), 150);
    }
  }

  customElements.define('dds-readmore', DdsReadMore);
}
