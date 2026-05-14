const HOVER_SELECTOR =
  'a, button, label, input, textarea, select, [data-cursor="hover"]';

const isCoarsePointer = (): boolean =>
  window.matchMedia('(pointer: coarse), (max-width: 900px)').matches;

const prefersReduced = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let mounted = false;
let rafId: number | null = null;
let cleanup: (() => void) | null = null;

const teardown = (): void => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  cleanup?.();
  cleanup = null;
  document.body.classList.remove('has-yarn-cursor');
  document
    .querySelectorAll('.cursor-yarn')
    .forEach((el) => el.remove());
  mounted = false;
};

const mount = (): void => {
  // Si el flag dice "montado" pero los nodos ya no existen (View Transitions
  // reemplazó el body), reseteamos para permitir un nuevo mount.
  if (mounted && !document.querySelector('.cursor-yarn')) {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    cleanup?.();
    cleanup = null;
    mounted = false;
  }
  if (mounted) return;
  mounted = true;

  document.body.classList.add('has-yarn-cursor');

  const ring = document.createElement('div');
  ring.className = 'cursor-yarn';
  ring.setAttribute('aria-hidden', 'true');

  const dot = document.createElement('div');
  dot.className = 'cursor-yarn dot';
  dot.setAttribute('aria-hidden', 'true');

  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  const onMove = (e: MouseEvent) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
  };

  const onOver = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest?.(HOVER_SELECTOR)) {
      ring.classList.add('hover');
    }
  };
  const onOut = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest?.(HOVER_SELECTOR)) {
      ring.classList.remove('hover');
    }
  };

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    rafId = document.hidden ? null : requestAnimationFrame(loop);
  };

  const onVisibility = () => {
    if (!document.hidden && rafId === null) {
      rafId = requestAnimationFrame(loop);
    }
  };

  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseover', onOver, { passive: true });
  document.addEventListener('mouseout', onOut, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  rafId = requestAnimationFrame(loop);

  cleanup = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseover', onOver);
    document.removeEventListener('mouseout', onOut);
    document.removeEventListener('visibilitychange', onVisibility);
  };
};

export const initCursor = (): void => {
  if (isCoarsePointer() || prefersReduced()) {
    teardown();
    return;
  }
  mount();
};

if (typeof window !== 'undefined') {
  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarseMq = window.matchMedia('(pointer: coarse), (max-width: 900px)');
  const onChange = () => initCursor();
  reducedMq.addEventListener?.('change', onChange);
  coarseMq.addEventListener?.('change', onChange);

  // Antes de un swap de View Transitions, liberamos listeners y rafId.
  // No tocamos los nodos: Astro reemplazará el <body> entero.
  document.addEventListener('astro:before-swap', () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    cleanup?.();
    cleanup = null;
    mounted = false;
  });
}
