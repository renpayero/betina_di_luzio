import { describe, it, expect } from 'vitest';
import { fmtARS, calcDiscount } from '~/lib/format';

describe('fmtARS', () => {
  it('formatea 1000 como $1.000', () => {
    expect(fmtARS(1000)).toBe('$1.000');
  });

  it('formatea 89000 como $89.000', () => {
    expect(fmtARS(89000)).toBe('$89.000');
  });

  it('formatea 0 como $0', () => {
    expect(fmtARS(0)).toBe('$0');
  });

  it('redondea 89999.6 a $90.000', () => {
    expect(fmtARS(89999.6)).toBe('$90.000');
  });
});

describe('calcDiscount', () => {
  it('calcula 20% para 80 sobre 100', () => {
    expect(calcDiscount(80, 100)).toBe(20);
  });

  it('calcula 26% para 89000 sobre 120000', () => {
    expect(calcDiscount(89000, 120000)).toBe(26);
  });
});
