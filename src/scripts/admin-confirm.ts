/**
 * Modal de confirmación personalizado para el admin.
 * Reemplaza `confirm()` native con un diálogo del design system.
 * Reusable: import { confirmDialog } y usar `await confirmDialog({...})`.
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const ensureStyles = (): void => {
  if (document.getElementById('admin-confirm-styles')) return;
  const style = document.createElement('style');
  style.id = 'admin-confirm-styles';
  style.textContent = `
    .admin-confirm-backdrop {
      position: fixed; inset: 0;
      background: rgba(54, 22, 14, 0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
      animation: admin-confirm-fade-in 0.15s ease-out;
    }
    @keyframes admin-confirm-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes admin-confirm-pop-in {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .admin-confirm-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      width: 90%;
      max-width: 440px;
      box-shadow: 0 24px 60px rgba(54, 22, 14, 0.2);
      animation: admin-confirm-pop-in 0.18s ease-out;
    }
    .admin-confirm-card h2 {
      font-family: var(--serif);
      font-size: 26px;
      line-height: 1.1;
      margin: 0 0 12px;
      color: var(--ink);
    }
    .admin-confirm-card p {
      margin: 0 0 24px;
      color: var(--ink-soft);
      font-size: 15px;
      line-height: 1.5;
    }
    .admin-confirm-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .admin-confirm-btn {
      padding: 11px 20px;
      border-radius: 4px;
      font-family: var(--mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      border: 1px solid var(--line);
      background: white;
      color: var(--ink);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .admin-confirm-btn:hover {
      border-color: var(--accent-deep);
      color: var(--accent-deep);
    }
    .admin-confirm-btn--primary {
      background: var(--ink);
      color: var(--bg);
      border-color: var(--ink);
    }
    .admin-confirm-btn--primary:hover {
      background: var(--accent-deep);
      border-color: var(--accent-deep);
      color: white;
    }
    .admin-confirm-btn--danger {
      background: var(--accent-deep);
      color: white;
      border-color: var(--accent-deep);
    }
    .admin-confirm-btn--danger:hover {
      background: #7a3a28;
      border-color: #7a3a28;
    }
    @media (prefers-reduced-motion: reduce) {
      .admin-confirm-backdrop,
      .admin-confirm-card { animation: none; }
    }
  `;
  document.head.appendChild(style);
};

export const confirmDialog = (opts: ConfirmOptions): Promise<boolean> => {
  ensureStyles();
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'admin-confirm-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'admin-confirm-title');

    const card = document.createElement('div');
    card.className = 'admin-confirm-card';

    const titleEl = document.createElement('h2');
    titleEl.id = 'admin-confirm-title';
    titleEl.textContent = opts.title;
    card.appendChild(titleEl);

    if (opts.message) {
      const msg = document.createElement('p');
      msg.textContent = opts.message;
      card.appendChild(msg);
    }

    const actions = document.createElement('div');
    actions.className = 'admin-confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'admin-confirm-btn';
    cancelBtn.textContent = opts.cancelText ?? 'Cancelar';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = `admin-confirm-btn ${
      opts.danger ? 'admin-confirm-btn--danger' : 'admin-confirm-btn--primary'
    }`;
    confirmBtn.textContent = opts.confirmText ?? 'Confirmar';

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(actions);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    confirmBtn.focus();

    const lastFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const close = (result: boolean): void => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      backdrop.remove();
      lastFocus?.focus?.();
      resolve(result);
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener('keydown', onKey);

    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(false);
    });
  });
};

export interface ToastOptions {
  message: string;
  tone?: 'ok' | 'err';
  duration?: number;
}

/**
 * Wire automático de forms con data-confirm.
 * Uso: `<form ... data-confirm="¿Borrar?" data-confirm-message="..." data-confirm-danger="true">`
 * Intercepta el submit, abre confirmDialog y solo submitea si el usuario confirma.
 */
export const initConfirmForms = (): void => {
  document.querySelectorAll<HTMLFormElement>('form[data-confirm]').forEach((form) => {
    if (form.dataset.confirmWired === 'true') return;
    form.dataset.confirmWired = 'true';
    form.addEventListener('submit', async (e) => {
      // Si ya pasó el confirm, dejamos submit normal
      if (form.dataset.confirmed === 'true') {
        form.removeAttribute('data-confirmed');
        return;
      }
      e.preventDefault();
      const ok = await confirmDialog({
        title: form.dataset.confirm ?? '¿Confirmar?',
        message: form.dataset.confirmMessage ?? undefined,
        confirmText: form.dataset.confirmText ?? 'Confirmar',
        cancelText: form.dataset.confirmCancel ?? 'Cancelar',
        danger: form.dataset.confirmDanger === 'true',
      });
      if (ok) {
        form.dataset.confirmed = 'true';
        form.requestSubmit();
      }
    });
  });
};

export const toast = ({ message, tone = 'err', duration = 3500 }: ToastOptions): void => {
  ensureStyles();
  if (!document.getElementById('admin-toast-styles')) {
    const s = document.createElement('style');
    s.id = 'admin-toast-styles';
    s.textContent = `
      .admin-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        max-width: 360px;
        padding: 14px 18px;
        border-radius: 8px;
        background: white;
        border: 1px solid var(--line);
        box-shadow: 0 12px 30px rgba(54, 22, 14, 0.15);
        font-size: 14px;
        color: var(--ink);
        z-index: 9998;
        animation: admin-toast-in 0.2s ease-out;
      }
      .admin-toast--ok { border-left: 3px solid #2f8f5c; }
      .admin-toast--err { border-left: 3px solid var(--accent-deep); }
      @keyframes admin-toast-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(s);
  }
  const el = document.createElement('div');
  el.className = `admin-toast admin-toast--${tone}`;
  el.setAttribute('role', tone === 'err' ? 'alert' : 'status');
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), duration);
};
