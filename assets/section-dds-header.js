/* DDS header
 *
 * Two jobs, both lifted from Dawn's own sections/header.liquid so that
 * replacing that section does not silently drop behaviour:
 *
 * 1. `sticky-header` — powers the "On scroll up" option. The "Always" option
 *    is pure CSS (see the section's inline style block) and never loads this.
 * 2. Anchoring the customer-account dialog to the account button.
 */

if (!customElements.get('sticky-header')) {
  class StickyHeader extends HTMLElement {
    constructor() {
      super();
      this.setHeaderHeight = this.setHeaderHeight.bind(this);
    }

    connectedCallback() {
      this.header = document.querySelector('.section-header');
      this.mobileMediaQuery = window.matchMedia('(max-width: 990px)');
      this.headerIsAlwaysSticky = this.getAttribute('data-sticky-type') === 'always';
      this.headerBounds = {};

      this.setHeaderHeight();

      this.mobileMediaQuery.addEventListener('change', this.setHeaderHeight);

      if (this.headerIsAlwaysSticky) {
        this.header.classList.add('shopify-section-header-sticky');
      }

      this.currentScrollTop = 0;
      this.preventReveal = false;
      this.predictiveSearches = this.querySelectorAll('predictive-search');

      this.onScrollHandler = this.onScroll.bind(this);
      this.hideHeaderOnScrollUp = () => (this.preventReveal = true);

      this.addEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
      window.addEventListener('scroll', this.onScrollHandler, false);

      this.createObserver();
    }

    setHeaderHeight() {
      document.documentElement.style.setProperty('--header-height', `${this.header.offsetHeight}px`);
    }

    disconnectedCallback() {
      this.mobileMediaQuery.removeEventListener('change', this.setHeaderHeight);
      this.removeEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
      window.removeEventListener('scroll', this.onScrollHandler);
    }

    createObserver() {
      let observer = new IntersectionObserver((entries, observer) => {
        this.headerBounds = entries[0].intersectionRect;
        observer.disconnect();
      });

      observer.observe(this.header);
    }

    onScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if ([...this.predictiveSearches].some((predictiveSearch) => predictiveSearch.isOpen)) return;

      if (scrollTop > this.currentScrollTop && scrollTop > this.headerBounds.bottom) {
        this.header.classList.add('scrolled-past-header');
        if (this.preventHide) return;
        requestAnimationFrame(this.hide.bind(this));
      } else if (scrollTop < this.currentScrollTop && scrollTop > this.headerBounds.bottom) {
        this.header.classList.add('scrolled-past-header');
        if (!this.preventReveal) {
          requestAnimationFrame(this.reveal.bind(this));
        } else {
          window.clearTimeout(this.isScrolling);

          this.isScrolling = setTimeout(() => {
            this.preventReveal = false;
          }, 66);

          requestAnimationFrame(this.hide.bind(this));
        }
      } else if (scrollTop <= this.headerBounds.top) {
        this.header.classList.remove('scrolled-past-header');
        requestAnimationFrame(this.reset.bind(this));
      }

      this.currentScrollTop = scrollTop;
    }

    hide() {
      if (this.headerIsAlwaysSticky) return;
      this.header.classList.add('shopify-section-header-hidden', 'shopify-section-header-sticky');
      this.closeSearchModal();
    }

    reveal() {
      if (this.headerIsAlwaysSticky) return;
      this.header.classList.add('shopify-section-header-sticky', 'animate');
      this.header.classList.remove('shopify-section-header-hidden');
    }

    reset() {
      if (this.headerIsAlwaysSticky) return;
      this.header.classList.remove('shopify-section-header-hidden', 'shopify-section-header-sticky', 'animate');
    }

    closeSearchModal() {
      this.searchModals = this.searchModals || this.header.querySelectorAll('details-modal');
      this.searchModals.forEach((searchModal) => searchModal.close(false));
    }
  }

  customElements.define('sticky-header', StickyHeader);
}

// The account `open` event is composed but does not bubble, so listen during capture.
// Anchor the dialog to the bottom of the account button itself.
document.addEventListener(
  'open',
  (event) => {
    if (!(event.target instanceof HTMLElement) || !event.target.matches('shopify-account')) return;

    const bottom = Math.max(0, Math.round(event.target.getBoundingClientRect().bottom));
    event.target.style.setProperty('--account-dialog-top', `${bottom}px`);
  },
  true
);
