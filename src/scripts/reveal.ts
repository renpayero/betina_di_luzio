const prefersReduced = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const initReveal = (): void => {
  const els = document.querySelectorAll<HTMLElement>('.reveal:not(.in)');
  if (!els.length) return;
  if (prefersReduced()) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
  );
  els.forEach((el) => io.observe(el));
};

export const initNavScroll = (): void => {
  const nav = document.querySelector<HTMLElement>('.nav');
  if (!nav) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
      ticking = false;
    });
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const initCounters = (): void => {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!counters.length) return;

  if (prefersReduced()) {
    counters.forEach((el) => {
      const target = Number(el.dataset.count ?? '0');
      const suffix = el.dataset.suffix ?? '';
      el.textContent = target + suffix;
    });
    return;
  }

  const animate = (el: HTMLElement) => {
    const target = Number(el.dataset.count ?? '0');
    const suffix = el.dataset.suffix ?? '';
    const duration = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = Math.floor(target * easeOutCubic(t));
      el.textContent = value + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        animate(entry.target as HTMLElement);
      }
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => io.observe(c));
};
