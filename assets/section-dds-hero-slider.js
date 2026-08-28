/* DDS hero slider
 *
 * CSS scroll-snap track with dots, desktop arrows and optional autoplay.
 * No library. Assumes LTR — scrollLeft maths would need inverting for RTL.
 *
 * Not built on Dawn's <slideshow-component>: it only assigns
 * `this.reducedMotion` inside its `if (this.announcementBarSlider)` branch, so
 * without an announcement bar and without a `.slideshow__autoplay` toggle,
 * setAutoPlay() dereferences undefined. It also requires .slideshow__slide /
 * .slider-counter__link / [id^="Slide-"] markup this design does not use.
 */

if (!customElements.get('dds-hero-slider')) {
  class DdsHeroSlider extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-hero-track]');
      if (!this.track) return;

      this.slides = Array.from(this.track.children);
      if (this.slides.length < 2) return;

      this.dots = Array.from(this.querySelectorAll('[data-hero-dot]'));
      this.prevButton = this.querySelector('[data-hero-prev]');
      this.nextButton = this.querySelector('[data-hero-next]');

      this.index = 0;
      this.autoplayTimer = null;
      this.scrollTimer = null;
      this.resizeTimer = null;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.onScroll = this.handleScroll.bind(this);
      this.onResize = this.handleResize.bind(this);
      this.onPointerDown = this.pause.bind(this);
      this.onMouseEnter = this.pause.bind(this);
      this.onMouseLeave = this.play.bind(this);
      this.onFocusIn = this.pause.bind(this);
      this.onFocusOut = this.play.bind(this);
      this.onMotionChange = this.handleMotionChange.bind(this);

      this.track.addEventListener('scroll', this.onScroll, { passive: true });
      this.track.addEventListener('pointerdown', this.onPointerDown, { passive: true });
      this.addEventListener('mouseenter', this.onMouseEnter);
      this.addEventListener('mouseleave', this.onMouseLeave);
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('focusout', this.onFocusOut);
      window.addEventListener('resize', this.onResize);
      this.reducedMotion.addEventListener('change', this.onMotionChange);

      this.dotHandlers = this.dots.map((dot, i) => {
        const handler = () => {
          this.stop();
          this.goTo(i, true);
        };
        dot.addEventListener('click', handler);
        return handler;
      });

      if (this.prevButton) {
        this.onPrev = () => {
          this.stop();
          this.goTo(this.index - 1, true);
        };
        this.prevButton.addEventListener('click', this.onPrev);
      }

      if (this.nextButton) {
        this.onNext = () => {
          this.stop();
          this.goTo(this.index + 1, true);
        };
        this.nextButton.addEventListener('click', this.onNext);
      }

      this.play();
    }

    disconnectedCallback() {
      this.stop();
      clearTimeout(this.scrollTimer);
      clearTimeout(this.resizeTimer);

      if (!this.track) return;

      this.track.removeEventListener('scroll', this.onScroll);
      this.track.removeEventListener('pointerdown', this.onPointerDown);
      this.removeEventListener('mouseenter', this.onMouseEnter);
      this.removeEventListener('mouseleave', this.onMouseLeave);
      this.removeEventListener('focusin', this.onFocusIn);
      this.removeEventListener('focusout', this.onFocusOut);
      window.removeEventListener('resize', this.onResize);
      this.reducedMotion.removeEventListener('change', this.onMotionChange);

      this.dots.forEach((dot, i) => dot.removeEventListener('click', this.dotHandlers[i]));
      if (this.prevButton && this.onPrev) this.prevButton.removeEventListener('click', this.onPrev);
      if (this.nextButton && this.onNext) this.nextButton.removeEventListener('click', this.onNext);
    }

    goTo(i, smooth) {
      this.index = (i + this.slides.length) % this.slides.length;
      this.track.scrollTo({
        left: this.track.clientWidth * this.index,
        behavior: smooth && !this.reducedMotion.matches ? 'smooth' : 'auto',
      });
      this.markCurrent();
    }

    markCurrent() {
      this.dots.forEach((dot, i) => dot.setAttribute('aria-current', i === this.index ? 'true' : 'false'));
    }

    // The track is swipeable, so the dots have to follow the user, not just our clicks.
    handleScroll() {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        if (!this.track.clientWidth) return;
        this.index = Math.round(this.track.scrollLeft / this.track.clientWidth);
        this.markCurrent();
      }, 90);
    }

    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.goTo(this.index, false), 150);
    }

    handleMotionChange() {
      this.reducedMotion.matches ? this.stop() : this.play();
    }

    play() {
      if (this.autoplayTimer) return;
      if (this.reducedMotion.matches) return;
      if (this.dataset.autoplay !== 'true') return;

      const speed = (parseFloat(this.dataset.autoplaySpeed) || 6) * 1000;
      this.autoplayTimer = setInterval(() => this.goTo(this.index + 1, true), speed);
    }

    pause() {
      this.stop();
    }

    stop() {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  customElements.define('dds-hero-slider', DdsHeroSlider);
}

// Theme editor: jump to the slide the merchant just selected and hold there.
document.addEventListener('shopify:block:select', (event) => {
  const slider = event.target.closest('dds-hero-slider');
  if (!slider || typeof slider.goTo !== 'function') return;

  slider.stop();
  const index = Array.from(slider.querySelector('[data-hero-track]').children).indexOf(event.target);
  if (index > -1) slider.goTo(index, true);
});

document.addEventListener('shopify:block:deselect', (event) => {
  const slider = event.target.closest('dds-hero-slider');
  if (slider && typeof slider.play === 'function') slider.play();
});
