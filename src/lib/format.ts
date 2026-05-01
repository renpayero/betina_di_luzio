export const fmtARS = (n: number): string =>
  '$' + Math.round(n).toLocaleString('es-AR');

export const calcDiscount = (price: number, oldPrice: number): number =>
  Math.round((1 - price / oldPrice) * 100);
