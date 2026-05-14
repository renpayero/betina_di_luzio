/* ============================================
   Admin shared layout (sidebar + header)
   ============================================ */

const ADMIN_SIDEBAR = (active) => `
<aside class="admin-side">
  <div class="admin-brand">Betina · Di Luzio<small>Panel admin</small></div>
  <ul class="admin-nav">
    <li><a href="admin.html" class="${active==='dash'?'active':''}">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
      Dashboard
    </a></li>
    <li><a href="admin-productos.html" class="${active==='prod'?'active':''}">
      <svg viewBox="0 0 24 24"><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/></svg>
      Productos
    </a></li>
    <li><a href="admin-categorias.html" class="${active==='cat'?'active':''}">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Categorías
    </a></li>
    <li><a href="admin-cupones.html" class="${active==='coup'?'active':''}">
      <svg viewBox="0 0 24 24"><path d="M21 12a3 3 0 0 0-3-3V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a3 3 0 0 1 0 6v4a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4a3 3 0 0 0 3-3z"/></svg>
      Cupones · Promos
    </a></li>
    <li><a href="admin-stock.html" class="${active==='stock'?'active':''}">
      <svg viewBox="0 0 24 24"><path d="M20 7H4M20 12H4M20 17H4"/></svg>
      Stock
    </a></li>
    <li><a href="admin-contenido.html" class="${active==='cont'?'active':''}">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      Contenido
    </a></li>
  </ul>
</aside>
`;

const ADMIN_HEADER = (title, subtitle) => `
<header class="admin-header">
  <div>
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
  </div>
  <div class="actions">
    <button class="icon-btn" title="Notificaciones"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></button>
    <a href="index.html" class="icon-btn" title="Ver tienda"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></svg></a>
    <div class="user-chip">
      <div class="avatar">L</div>
      <span>Lili</span>
    </div>
  </div>
</header>
`;

window.BDLAdmin = {
  mount(active, title, subtitle) {
    document.body.classList.add('admin');
    document.querySelectorAll('[data-include="admin-side"]').forEach(el => el.outerHTML = ADMIN_SIDEBAR(active));
    document.querySelectorAll('[data-include="admin-header"]').forEach(el => el.outerHTML = ADMIN_HEADER(title, subtitle));
  }
};
