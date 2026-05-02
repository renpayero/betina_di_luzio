const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const MENU_ID = 'mobile-menu';
const STATE_FLAG = '__bdlMobileMenuMounted';

type WindowWithFlag = Window & { [STATE_FLAG]?: boolean };

const prefersReduced = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getScrollbarWidth = (): number =>
  Math.max(0, window.innerWidth - document.documentElement.clientWidth);

interface ScrollLockMemo {
  paddingRight: string;
  overflow: string;
  scrollY: number;
}

let scrollLock: ScrollLockMemo | null = null;

const lockScroll = (): void => {
  if (scrollLock) return;
  const sbw = getScrollbarWidth();
  scrollLock = {
    paddingRight: document.body.style.paddingRight,
    overflow: document.body.style.overflow,
    scrollY: window.scrollY,
  };
  if (sbw > 0) {
    document.body.style.paddingRight = `${sbw}px`;
  }
  document.body.style.overflow = 'hidden';
};

const unlockScroll = (): void => {
  if (!scrollLock) return;
  document.body.style.paddingRight = scrollLock.paddingRight;
  document.body.style.overflow = scrollLock.overflow;
  scrollLock = null;
};

const focusableInside = (root: HTMLElement): HTMLElement[] => {
  const all = Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
  return all.filter((el) => {
    if (el.hasAttribute('hidden')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  });
};

const setMainHidden = (hidden: boolean): void => {
  const main = document.querySelector<HTMLElement>('main');
  if (!main) return;
  if (hidden) {
    main.setAttribute('aria-hidden', 'true');
    main.setAttribute('inert', '');
  } else {
    main.removeAttribute('aria-hidden');
    main.removeAttribute('inert');
  }
};

export const initMobileMenu = (): void => {
  const w = window as WindowWithFlag;

  const menu = document.getElementById(MENU_ID);
  const toggle = document.querySelector<HTMLButtonElement>(
    '[data-mobile-menu-toggle]'
  );
  if (!menu || !toggle) return;

  const panel = menu.querySelector<HTMLElement>('[data-mobile-menu-panel]');
  const backdrop = menu.querySelector<HTMLElement>(
    '[data-mobile-menu-backdrop]'
  );
  const closeBtn = menu.querySelector<HTMLButtonElement>(
    '[data-mobile-menu-close]'
  );
  if (!panel || !backdrop || !closeBtn) return;

  if (w[STATE_FLAG]) {
    // Re-bind toggle/close on idempotent reinit (View Transitions persist nav).
    return;
  }
  w[STATE_FLAG] = true;

  let isOpen = false;
  let lastFocused: HTMLElement | null = null;

  const open = (): void => {
    if (isOpen) return;
    isOpen = true;
    lastFocused = (document.activeElement as HTMLElement | null) ?? toggle;

    menu.setAttribute('data-state', 'open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    setMainHidden(true);
    lockScroll();

    // Reduced-motion: skip transitions; otherwise CSS handles the slide-in.
    if (prefersReduced()) {
      menu.setAttribute('data-reduced', 'true');
    }

    // Focus close button as initial focus stop.
    requestAnimationFrame(() => {
      closeBtn.focus({ preventScroll: true });
    });
  };

  const close = (): void => {
    if (!isOpen) return;
    isOpen = false;

    menu.setAttribute('data-state', 'closed');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    setMainHidden(false);
    unlockScroll();
    menu.removeAttribute('data-reduced');

    // Restore focus to the toggle that opened the drawer.
    const target = lastFocused ?? toggle;
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
    });
  };

  const onToggleClick = (e: MouseEvent): void => {
    e.preventDefault();
    isOpen ? close() : open();
  };

  const onCloseClick = (e: MouseEvent): void => {
    e.preventDefault();
    close();
  };

  const onBackdropClick = (): void => {
    close();
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusables = focusableInside(panel);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;

    const active = document.activeElement as HTMLElement | null;
    const inPanel = active ? panel.contains(active) : false;

    if (!inPanel) {
      e.preventDefault();
      first.focus();
      return;
    }

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Close after navigating via any in-menu link (View Transitions keeps DOM).
  const linkEls = menu.querySelectorAll<HTMLAnchorElement>(
    '[data-mobile-menu-link]'
  );
  linkEls.forEach((link) => {
    link.addEventListener('click', () => {
      // Defer so navigation kicks off before we strip state.
      close();
    });
  });

  toggle.addEventListener('click', onToggleClick);
  closeBtn.addEventListener('click', onCloseClick);
  backdrop.addEventListener('click', onBackdropClick);
  document.addEventListener('keydown', onKeyDown);

  // Close if viewport grows past mobile breakpoint while open.
  const desktopMq = window.matchMedia('(min-width: 900px)');
  const onMqChange = (ev: MediaQueryListEvent): void => {
    if (ev.matches && isOpen) close();
  };
  desktopMq.addEventListener?.('change', onMqChange);

  // Hard reset on full page swaps so a stale lock can't survive navigation.
  document.addEventListener(
    'astro:before-swap',
    () => {
      if (isOpen) {
        // Don't restore focus mid-swap; just clean up.
        isOpen = false;
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('data-state', 'closed');
        menu.setAttribute('aria-hidden', 'true');
        setMainHidden(false);
        unlockScroll();
      }
    },
    { once: false }
  );
};
