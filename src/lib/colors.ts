export const COLOR_NAMES: Record<string, string> = {
  '#CB674C': 'Terracota',
  '#36160E': 'Tinta',
  '#FCF5F4': 'Crema',
  '#6C95B0': 'Azul polvo',
  '#595421': 'Olivo',
  '#DBD7D3': 'Crudo',
  '#1E2D37': 'Noche',
  '#984C37': 'Cobre',
  '#653022': 'Borgoña',
  '#EEC5BA': 'Rosa pálido',
  '#CCDEEA': 'Cielo',
  '#B7B0A9': 'Piedra',
  '#4D4A47': 'Carbón',
  '#537389': 'Acero',
  '#918B85': 'Ceniza',
};

export const colorName = (hex: string): string =>
  COLOR_NAMES[hex.toUpperCase()] ?? COLOR_NAMES[hex] ?? hex;
