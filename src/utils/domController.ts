/**
 * Apple Store DOM Controller
 * Enhances the pre-rendered Apple HTML elements with seamless interactive behavior.
 */

export interface DomControllerCallbacks {
  onOpenGiftModal?: (modelId: string) => void;
  onOpenBuyModal: (modelId: string) => void;
  onOpenChat: () => void;
  onOpenBag: () => void;
  onOpenCompare: () => void;
  onOpenTradeIn: () => void;
  onOpenSettings?: () => void;
  bagCount: number;
}

export function initDomController(callbacks: DomControllerCallbacks) {
  // 1. Setup Global Navigation Flyouts and Search Intercept
  setupGlobalNavFlyouts(callbacks);

  // 2. Setup Shelf Paddle Scrollers & Drag-to-Scroll
  setupShelfScrollers();

  // 3. Setup Subnav (rf-navbar) Smooth Scrolling & Active State
  setupSubnavTracking();

  // 4. Setup Promo Banner Rotation
  setupPromoRibbon();

  // 5. Setup Swatch Color Switching
  setupSwatches();

  // 6. Setup Intercepts for Buy, Chat, Compare, and Trade In buttons
  setupActionInterceptors(callbacks);

  // 7. Transform all Buy buttons to Gift buttons
  setupBuyToGiftTransform();

  // 8. Setup Image Fallback
  setupImageFallbacks();

  // 9. Update Bag Badge in Nav
  updateBagBadge(callbacks.bagCount);
}

function setupBuyToGiftTransform() {
  const replaceBuyWithGift = () => {
    const targets = document.querySelectorAll<HTMLElement>(
      '.rf-hcard-cta, .rf-hcard-buy-button, .rf-hcard-gift-button, .rf-hcard .button, .rf-cards-scroller-item .button, .rf-hcard-scrim .button, a[href*="buy"] .button'
    );
    targets.forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt === 'Buy' || txt === 'View pricing' || txt === 'Pre-order' || txt === 'Pre‑order') {
        el.textContent = 'Gift';
      }
    });

    // Also look for any standalone buttons or links whose text is strictly "Buy" inside store shelves
    document.querySelectorAll<HTMLElement>('.rf-shelf .button, .rf-cards-scroller span, .rf-hcard a span').forEach((el) => {
      if (el.children.length === 0 && el.textContent?.trim() === 'Buy') {
        el.textContent = 'Gift';
      }
    });
  };

  replaceBuyWithGift();

  const observer = new MutationObserver(() => {
    replaceBuyWithGift();
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function setupGlobalNavFlyouts(callbacks: DomControllerCallbacks) {
  const curtain = document.getElementById('globalnav-curtain');
  const flyouts = document.querySelectorAll<HTMLElement>('.globalnav-flyout');
  const navLinks = document.querySelectorAll<HTMLElement>('.globalnav-item a, .globalnav-item button, .globalnav-link');

  let currentFlyout: HTMLElement | null = null;
  let timeoutId: any = null;

  const closeAllFlyouts = () => {
    flyouts.forEach((f) => f.classList.remove('is-open'));
    if (curtain) curtain.classList.remove('is-open');
    currentFlyout = null;
  };

  if (curtain) {
    curtain.addEventListener('click', closeAllFlyouts);
  }

  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
    const text = (link.textContent || '').trim().toLowerCase();
    const id = (link.id || '').toLowerCase();

    // Search button -> Opens Account & Balance Settings
    if (ariaLabel.includes('search') || id.includes('search') || href.includes('search') || text === 'search') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllFlyouts();
        if (callbacks.onOpenSettings) callbacks.onOpenSettings();
      });
      return;
    }

    // Bag button -> Opens BagDrawer
    if (ariaLabel.includes('bag') || id.includes('bag') || href.includes('bag') || text === 'bag') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllFlyouts();
        callbacks.onOpenBag();
      });
      return;
    }

    // Map link to flyout ID
    let targetFlyoutId = '';
    if (href.includes('/store') || text === 'store') targetFlyoutId = 'globalnav-submenu-link-store';
    else if (href.includes('/mac') || text === 'mac') targetFlyoutId = 'globalnav-submenu-link-mac';
    else if (href.includes('/ipad') || text === 'ipad') targetFlyoutId = 'globalnav-submenu-link-ipad';
    else if (href.includes('/iphone') || text === 'iphone') targetFlyoutId = 'globalnav-submenu-link-iphone';
    else if (href.includes('/watch') || text === 'watch') targetFlyoutId = 'globalnav-submenu-link-watch';
    else if (href.includes('/vision') || text === 'vision') targetFlyoutId = 'globalnav-submenu-link-vision';
    else if (href.includes('/airpods') || text === 'airpods') targetFlyoutId = 'globalnav-submenu-link-airpods';
    else if (href.includes('/tv-home') || text.includes('tv & home')) targetFlyoutId = 'globalnav-submenu-link-tv-home';
    else if (href.includes('/entertainment') || text === 'entertainment') targetFlyoutId = 'globalnav-submenu-link-entertainment';
    else if (href.includes('/accessories') || text === 'accessories') targetFlyoutId = 'globalnav-submenu-link-accessories';
    else if (href.includes('/support') || text === 'support') targetFlyoutId = 'globalnav-submenu-link-support';

    if (targetFlyoutId) {
      const flyout = document.getElementById(targetFlyoutId);
      if (flyout) {
        const openFlyout = (e: Event) => {
          e.preventDefault();
          clearTimeout(timeoutId);
          flyouts.forEach((f) => {
            if (f !== flyout) f.classList.remove('is-open');
          });
          flyout.classList.add('is-open');
          if (curtain) curtain.classList.add('is-open');
          currentFlyout = flyout;
        };

        link.addEventListener('mouseenter', openFlyout);
        link.addEventListener('click', openFlyout);

        flyout.addEventListener('mouseenter', () => clearTimeout(timeoutId));
        flyout.addEventListener('mouseleave', () => {
          timeoutId = setTimeout(closeAllFlyouts, 200);
        });
      }
    }
  });

  const header = document.getElementById('globalheader');
  if (header) {
    header.addEventListener('mouseleave', () => {
      timeoutId = setTimeout(closeAllFlyouts, 250);
    });
  }
}

function setupShelfScrollers() {
  const scrollerContainers = document.querySelectorAll<HTMLElement>(
    '.rf-shelf-content, [data-core-scroller], .rf-cards-scroller-content, .rc-ribbon-content-gallery, .as-bannerslider'
  );

  scrollerContainers.forEach((container) => {
    // Ensure horizontal scrolling is fully active
    container.style.overflowX = 'auto';
    container.style.scrollBehavior = 'smooth';
    container.style.cursor = 'grab';

    const parentShelf = container.closest<HTMLElement>('.rf-shelf, .rs-cardsshelf, .rf-cards-scroller, .rf-section') || container.parentElement;

    // Find previous / next paddle buttons
    const prevButtons = parentShelf ? parentShelf.querySelectorAll<HTMLButtonElement>('.paddlenav-arrow-previous, .rf-shelf-paddlenav-previous, [data-core-paddlenav-prev]') : [];
    const nextButtons = parentShelf ? parentShelf.querySelectorAll<HTMLButtonElement>('.paddlenav-arrow-next, .rf-shelf-paddlenav-next, [data-core-paddlenav-next]') : [];

    const updatePaddleState = () => {
      prevButtons.forEach((prevButton) => {
        const isStart = container.scrollLeft <= 10;
        prevButton.disabled = isStart;
        prevButton.style.opacity = isStart ? '0.3' : '1';
        prevButton.style.cursor = isStart ? 'default' : 'pointer';
      });

      nextButtons.forEach((nextButton) => {
        const isEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 15;
        nextButton.disabled = isEnd;
        nextButton.style.opacity = isEnd ? '0.3' : '1';
        nextButton.style.cursor = isEnd ? 'default' : 'pointer';
      });
    };

    updatePaddleState();
    container.addEventListener('scroll', updatePaddleState, { passive: true });

    prevButtons.forEach((prevButton) => {
      prevButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.scrollBy({ left: -420, behavior: 'smooth' });
      });
    });

    nextButtons.forEach((nextButton) => {
      nextButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.scrollBy({ left: 420, behavior: 'smooth' });
      });
    });

    // Mouse Drag to Scroll
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.style.cursor = 'grab';
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    });

    // Mouse Wheel Horizontal Scroll
    container.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        // Vertical wheel transformed to horizontal scroll inside card shelf
        container.scrollLeft += e.deltaY * 0.8;
      }
    }, { passive: true });
  });

  // Global paddle listener for any stray paddle buttons on the page
  document.querySelectorAll<HTMLButtonElement>('.paddlenav-arrow').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const isNext = btn.classList.contains('paddlenav-arrow-next');
      const scroller = btn.closest('.rf-shelf, .rs-cardsshelf, .rf-cards-scroller')?.querySelector<HTMLElement>('.rf-cards-scroller-content, [data-core-scroller], .rf-shelf-content');
      if (scroller) {
        e.preventDefault();
        scroller.scrollBy({ left: isNext ? 420 : -420, behavior: 'smooth' });
      }
    });
  });
}

function setupSubnavTracking() {
  const navbar = document.getElementById('rf-navbar');
  if (!navbar) return;

  const links = navbar.querySelectorAll<HTMLAnchorElement>('.rf-navbar-item-link');

  // Click smooth scroll
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        e.preventDefault();
        const top = targetEl.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Track active section on scroll
  const onScroll = () => {
    const scrollPos = window.scrollY + 140;
    links.forEach((link) => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        const top = targetEl.offsetTop;
        const height = targetEl.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          links.forEach((l) => l.classList.remove('current'));
          link.classList.add('current');
        }
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

function setupPromoRibbon() {
  const items = document.querySelectorAll<HTMLElement>('.rc-ribbon-gallery-item');
  if (items.length <= 1) return;

  let currentIndex = 0;
  const interval = setInterval(() => {
    items[currentIndex].setAttribute('aria-hidden', 'true');
    items[currentIndex].classList.remove('is-active');
    currentIndex = (currentIndex + 1) % items.length;
    items[currentIndex].setAttribute('aria-hidden', 'false');
    items[currentIndex].classList.add('is-active');
  }, 5000);

  // Cleanup if needed
  window.addEventListener('beforeunload', () => clearInterval(interval));
}

function setupSwatches() {
  // Swatch click handlers to update the phone card image preview
  const swatches = document.querySelectorAll<HTMLElement>('.rf-hcard-content-colorimage');

  swatches.forEach((swatch) => {
    swatch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const card = swatch.closest<HTMLElement>('.rf-hcard');
      if (!card) return;

      // Update active swatch class
      const cardSwatches = card.querySelectorAll<HTMLElement>('.rf-hcard-content-colorimage');
      cardSwatches.forEach((s) => s.classList.remove('active-swatch'));
      swatch.classList.add('active-swatch');

      // Get color swatch URL or finish name
      const swatchImg = swatch.querySelector<HTMLImageElement>('img')?.getAttribute('src') || '';
      const cardImg = card.querySelector<HTMLImageElement>('.rf-hcard-img-wrapper img');
      if (!cardImg) return;

      // Determine finish
      if (swatchImg.includes('night-sky') || swatchImg.includes('spaceblack') || swatchImg.includes('black')) {
        if (cardImg.src.includes('duo')) cardImg.src = '/images/iphone-card-40-duo-spaceblack-transparent.png';
        else if (cardImg.src.includes('18pro')) cardImg.src = '/images/iphone-card-40-18pro-black-transparent.png';
        else if (cardImg.src.includes('17air')) cardImg.src = '/images/iphone-card-40-17air-spaceblack-transparent.png';
        else if (cardImg.src.includes('17-')) cardImg.src = '/images/iphone-card-40-17-black-transparent.png';
      } else if (swatchImg.includes('star-white') || swatchImg.includes('white') || swatchImg.includes('cloudwhite')) {
        if (cardImg.src.includes('duo')) cardImg.src = '/images/iphone-card-40-duo-starwhite-transparent.png';
        else if (cardImg.src.includes('18pro')) cardImg.src = '/images/iphone-card-40-18pro-silver-transparent.png';
        else if (cardImg.src.includes('17air')) cardImg.src = '/images/iphone-card-40-17air-cloudwhite-transparent.png';
        else if (cardImg.src.includes('17-')) cardImg.src = '/images/iphone-card-40-17-white-transparent.png';
      } else if (swatchImg.includes('burgundy')) {
        if (cardImg.src.includes('18pro')) cardImg.src = '/images/iphone-card-40-18pro-burgundy-transparent.png';
      } else if (swatchImg.includes('glacier')) {
        if (cardImg.src.includes('18pro')) cardImg.src = '/images/iphone-card-40-18pro-glacier-transparent.png';
      } else if (swatchImg.includes('skyblue') || swatchImg.includes('mistblue')) {
        if (cardImg.src.includes('17air')) cardImg.src = '/images/iphone-card-40-17air-skyblue-transparent.png';
        else if (cardImg.src.includes('17-')) cardImg.src = '/images/iphone-card-40-17-mistblue-transparent.png';
      }
    });
  });
}

function setupActionInterceptors(callbacks: DomControllerCallbacks) {
  // 1. Gift Buttons on storefront cards
  document.querySelectorAll<HTMLElement>('.rf-hcard-cta, .rf-hcard-gift-button, [data-gift]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modelId = btn.getAttribute('data-gift') || getModelIdFromContext(btn);
      if (callbacks.onOpenGiftModal) {
        callbacks.onOpenGiftModal(modelId);
      } else {
        callbacks.onOpenBuyModal(modelId);
      }
    });
  });

  // 2. Buy Links & Platter Clicks
  document.querySelectorAll<HTMLElement>('a[href*="shop/buy-iphone"], [data-autom*="buy"], [data-trigger-click*="buy"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modelId = getModelIdFromContext(el);
      if (callbacks.onOpenGiftModal) {
        callbacks.onOpenGiftModal(modelId);
      } else {
        callbacks.onOpenBuyModal(modelId);
      }
    });
  });

  // 3. Specialist Chat Triggers
  document.querySelectorAll<HTMLElement>('[data-analytics-title*="specialist"], a[href*="chat"], .rf-specialist-cta').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      callbacks.onOpenChat();
    });
  });

  // 4. Trade-In Triggers
  document.querySelectorAll<HTMLElement>('[data-analytics-title*="trade-in"], a[href*="trade-in"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      callbacks.onOpenTradeIn();
    });
  });

  // 5. Compare Triggers
  document.querySelectorAll<HTMLElement>('[data-analytics-title*="compare"], a[href*="compare"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      callbacks.onOpenCompare();
    });
  });
}

function getModelIdFromContext(element: HTMLElement): string {
  const card = element.closest('.rf-hcard, .rf-cards-scroller-itemview, [data-core-scroller-item]');
  if (!card) return 'iphone-18-pro';

  const text = (card.textContent || '').toLowerCase();
  if (text.includes('duo')) return 'iphone-duo';
  if (text.includes('18 pro')) return 'iphone-18-pro';
  if (text.includes('air')) return 'iphone-air';
  if (text.includes('17e')) return 'iphone-17e';
  if (text.includes('17')) return 'iphone-17';
  if (text.includes('16')) return 'iphone-16';

  return 'iphone-18-pro';
}

function setupImageFallbacks() {
  document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.addEventListener('error', () => {
      const src = img.src || '';
      if (src.includes('duo')) img.src = '/images/iphone-card-40-duo-202609-transparent.png';
      else if (src.includes('18pro')) img.src = '/images/iphone-card-40-18pro-202609-transparent.png';
      else if (src.includes('17air') || src.includes('air')) img.src = '/images/iphone-card-40-17air-202509-transparent.png';
      else if (src.includes('17e')) img.src = '/images/iphone-card-40-17e-202603-transparent.png';
      else if (src.includes('17')) img.src = '/images/iphone-card-40-17-202509-transparent.png';
    });
  });
}

export function updateBagBadge(count: number) {
  const bagLinks = document.querySelectorAll<HTMLElement>('.globalnav-item-bag a, #globalnav-menubutton-bag, [aria-label*="Bag"]');
  bagLinks.forEach((bag) => {
    let badge = bag.querySelector<HTMLElement>('.globalnav-bag-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'globalnav-bag-badge';
        badge.style.position = 'absolute';
        badge.style.top = '6px';
        badge.style.right = '6px';
        badge.style.backgroundColor = '#0071e3';
        badge.style.color = '#ffffff';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.width = '16px';
        badge.style.height = '16px';
        badge.style.borderRadius = '50%';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.pointerEvents = 'none';
        bag.style.position = 'relative';
        bag.appendChild(badge);
      }
      badge.textContent = String(count);
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  });
}
