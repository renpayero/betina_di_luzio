import { describe, it, expect } from 'vitest';
import { colorName } from '~/lib/colors';

describe('colorName', () => {
  it('devuelve "Terracota" para #CB674C (uppercase exacto)', () => {
    expect(colorName('#CB674C')).toBe('Terracota');
  });

  it('devuelve "Terracota" para #cb674c (lowercase, normalizado a uppercase)', () => {
    // colors.ts hace hex.toUpperCase() antes del lookup, así que lowercase resuelve.
    expect(colorName('#cb674c')).toBe('Terracota');
  });

  it('devuelve el hex original cuando no está en el mapa', () => {
    expect(colorName('#FF00FF')).toBe('#FF00FF');
  });
});
