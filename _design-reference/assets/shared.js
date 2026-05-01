/* ============================================
   Shared utilities — cursor, reveal, nav, cart
   ============================================ */

// === Custom Yarn Cursor ===
(function initCursor() {
  if (window.matchMedia('(max-width: 900px)').matches) return;
  const ring = document.createElement('div');
  ring.className = 'cursor-yarn';
  const dot = document.createElement('div');
  dot.className = 'cursor-yarn dot';
  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  // Hover state on interactive elements
  const observer = new MutationObserver(bind);
  function bind() {
    document.querySelectorAll('a, button, .hoverable, [data-cursor="hover"]').forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = '1';
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }
  bind();
  observer.observe(document.body, { childList: true, subtree: true });
})();

// === Reveal on scroll ===
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

// === Nav scroll state ===
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// === Cart store (localStorage, shared) ===
window.BDLCart = {
  KEY: 'bdl_cart_v1',
  items() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  count() { return this.items().reduce((a, b) => a + b.qty, 0); },
  add(product) {
    const items = this.items();
    const key = product.id + '|' + (product.size||'') + '|' + (product.color||'');
    const ex = items.find(i => i.key === key);
    if (ex) ex.qty += product.qty || 1;
    else items.push({ key, ...product, qty: product.qty || 1 });
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },
  remove(key) {
    const items = this.items().filter(i => i.key !== key);
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },
  setQty(key, qty) {
    const items = this.items();
    const it = items.find(i => i.key === key);
    if (it) it.qty = Math.max(1, qty);
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },
  clear() { localStorage.removeItem(this.KEY); this.updateBadge(); },
  total() { return this.items().reduce((a, b) => a + b.price * b.qty, 0); },
  updateBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
      const c = this.count();
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }
};
document.addEventListener('DOMContentLoaded', () => window.BDLCart.updateBadge());

// === Page transition on internal links ===
(function initPageTransition() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;
    if (a.dataset.noTransition) return;
    e.preventDefault();
    overlay.classList.add('in');
    setTimeout(() => { window.location.href = href; }, 600);
  });
})();

// === Format ARS ===
window.fmtARS = (n) => '$' + Math.round(n).toLocaleString('es-AR');
