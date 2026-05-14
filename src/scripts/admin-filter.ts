/**
 * Filtros instantáneos del admin.
 * - search input con [data-filter-rows]: filtra client-side las filas de la tabla
 *   apuntada por [data-filter-target] (por defecto, busca el primer tbody dentro
 *   del mismo formulario o, si no, del primer .panel posterior).
 *   Sin recargas. Vacío = mostrar todo.
 * - select con [data-filter-submit]: hace submit del form al cambiar.
 * - Buttons con type="submit" y data-filter-hidden-on-auto se ocultan: ya no son
 *   necesarios porque el filtro es automático.
 *
 * Mantiene compatibilidad con navegación sin JS: el form sigue siendo POST/GET
 * normal y el botón submit funcional si el JS no carga.
 */

const FILTER_ROW_ATTR = 'data-filter-row-text';

const matchesAll = (haystack: string, needles: string[]): boolean =>
  needles.every((n) => haystack.includes(n));

const tokenize = (q: string): string[] =>
  q
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const findTargetTable = (input: HTMLInputElement): HTMLTableSectionElement | null => {
  const target = input.dataset.filterTarget;
  if (target) {
    return document.querySelector<HTMLTableSectionElement>(target);
  }
  const form = input.closest('form');
  if (form) {
    const after = form.nextElementSibling;
    const tbody = after?.querySelector?.('tbody');
    if (tbody) return tbody as HTMLTableSectionElement;
  }
  return document.querySelector<HTMLTableSectionElement>('tbody');
};

const cacheRowText = (tbody: HTMLTableSectionElement): void => {
  tbody.querySelectorAll<HTMLTableRowElement>('tr').forEach((tr) => {
    if (tr.dataset[
      'filterRowText' as keyof DOMStringMap
    ]) return;
    const text = tr.textContent?.toLowerCase().replace(/\s+/g, ' ').trim() ?? '';
    tr.setAttribute(FILTER_ROW_ATTR, text);
  });
};

const applyFilter = (
  tbody: HTMLTableSectionElement,
  query: string,
  emptyMsg?: HTMLElement | null
): void => {
  const tokens = tokenize(query);
  let visible = 0;
  tbody.querySelectorAll<HTMLTableRowElement>('tr').forEach((tr) => {
    const text = tr.getAttribute(FILTER_ROW_ATTR) ?? '';
    const ok = tokens.length === 0 || matchesAll(text, tokens);
    tr.hidden = !ok;
    if (ok) visible++;
  });
  if (emptyMsg) emptyMsg.hidden = visible !== 0 || query.length === 0;
};

const wireSearchInputs = (): void => {
  document
    .querySelectorAll<HTMLInputElement>('input[data-filter-rows]')
    .forEach((input) => {
      if (input.dataset.filterWired === 'true') return;
      input.dataset.filterWired = 'true';
      const tbody = findTargetTable(input);
      if (!tbody) return;
      cacheRowText(tbody);

      let emptyMsg = document.querySelector<HTMLElement>('[data-filter-empty]');
      if (!emptyMsg) {
        emptyMsg = document.createElement('p');
        emptyMsg.setAttribute('data-filter-empty', '');
        emptyMsg.className = 'filter-empty';
        emptyMsg.textContent = 'Sin resultados que coincidan con la búsqueda.';
        emptyMsg.hidden = true;
        tbody.parentElement?.after(emptyMsg);
      }

      applyFilter(tbody, input.value, emptyMsg);

      let raf = 0;
      const onInput = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => applyFilter(tbody, input.value, emptyMsg));
      };
      input.addEventListener('input', onInput);

      // Evitar que Enter sobre el search input recargue la página.
      // El select de filtros (data-filter-submit) sí debe poder submitear.
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFilter(tbody, input.value, emptyMsg);
        }
      });
    });
};

const wireAutoSubmitSelects = (): void => {
  document
    .querySelectorAll<HTMLSelectElement>('select[data-filter-submit]')
    .forEach((sel) => {
      if (sel.dataset.filterWired === 'true') return;
      sel.dataset.filterWired = 'true';
      sel.addEventListener('change', () => {
        sel.form?.requestSubmit();
      });
    });
};

const hideObsoleteButtons = (): void => {
  document
    .querySelectorAll<HTMLElement>('[data-filter-hidden-on-auto]')
    .forEach((btn) => {
      btn.hidden = true;
    });
};

export const initAdminFilter = (): void => {
  wireSearchInputs();
  wireAutoSubmitSelects();
  hideObsoleteButtons();
};
