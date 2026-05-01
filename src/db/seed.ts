import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]!] ??= m[2]!.replace(/^["']|["']$/g, '');
  }
} catch {}

const { db, pool } = await import('./client.ts');
import { inArray } from 'drizzle-orm';
import { categories, products, productImages, users } from './schema.ts';
import type { NewCategory, NewProduct, NewProductImage } from './schema.ts';
const { hashPassword } = await import('../lib/auth.ts');

const seedCategories: NewCategory[] = [
  { id: 'sweaters', slug: 'sweaters', name: 'Sweaters', blurb: 'Calidez tejida para cada estación.', sortOrder: 1 },
  { id: 'cardigans', slug: 'cardigans', name: 'Cardigans', blurb: 'Capas suaves, hechas para abrazar.', sortOrder: 2 },
  { id: 'mantas', slug: 'mantas', name: 'Mantas & Throws', blurb: 'Texturas para descansar.', sortOrder: 3 },
  { id: 'accesorios', slug: 'accesorios', name: 'Accesorios', blurb: 'Bufandas, gorros, mitones.', sortOrder: 4 },
  { id: 'bebes', slug: 'bebes', name: 'Bebés', blurb: 'Primeras prendas, pura ternura.', sortOrder: 5 },
  { id: 'home', slug: 'home', name: 'Living', blurb: 'Almohadones, tapices, detalles.', sortOrder: 6 },
];

const seedProducts: NewProduct[] = [
  {
    id: 'p01', slug: 'sweater-otono-terracota', name: 'Sweater Otoño Terracota',
    categoryId: 'sweaters', price: 89000, oldPrice: null, status: 'new', stock: 4,
    materials: 'Lana merino · 100%',
    description: 'Sweater de punto trenzado, tejido a dos agujas. Cuello redondo, mangas largas con detalle de canalé. Pieza única.',
    placeholder: 'SWEATER · TRENZADO · TERRACOTA',
    colors: ['#CB674C', '#36160E', '#DBD7D3'], sizes: ['S', 'M', 'L'],
    isFeatured: true, sortOrder: 1,
  },
  {
    id: 'p02', slug: 'cardigan-esencial-crema', name: 'Cardigan Esencial Crema',
    categoryId: 'cardigans', price: 102000, oldPrice: 120000, status: 'sale', stock: 2,
    materials: 'Algodón pima · Lana 30%',
    description: 'Cardigan oversize con botones de madera. Punto suave que se adapta al cuerpo.',
    placeholder: 'CARDIGAN · OVERSIZE · CREMA',
    colors: ['#FCF5F4', '#EEC5BA', '#6C95B0'], sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: true, sortOrder: 2,
  },
  {
    id: 'p03', slug: 'manta-rosario', name: 'Manta Rosario',
    categoryId: 'mantas', price: 145000, oldPrice: null, status: 'bestseller', stock: 3,
    materials: 'Lana de oveja · sin teñir',
    description: 'Manta tejida en crochet, punto granny gigante. Bordes con flecos hechos a mano.',
    placeholder: 'MANTA · GRANNY · CRUDO',
    colors: ['#DBD7D3', '#918B85'], sizes: ['Única 140x180'],
    isFeatured: true, sortOrder: 3,
  },
  {
    id: 'p04', slug: 'bufanda-trama-olivo', name: 'Bufanda Trama Olivo',
    categoryId: 'accesorios', price: 38000, oldPrice: null, status: null, stock: 6,
    materials: 'Lana merino · 100%',
    description: 'Bufanda de canalé inglés, abriga sin pesar.',
    placeholder: 'BUFANDA · CANALÉ · OLIVO',
    colors: ['#595421', '#36160E', '#984C37'], sizes: ['Única 200x30'],
    isFeatured: true, sortOrder: 4,
  },
  {
    id: 'p05', slug: 'conjunto-bebe-nube', name: 'Conjunto Bebé Nube',
    categoryId: 'bebes', price: 64000, oldPrice: null, status: 'new', stock: 5,
    materials: 'Algodón pima · hipoalergénico',
    description: 'Conjunto de body, gorrito y escarpines. Tejido con punto suave para piel sensible.',
    placeholder: 'BEBÉ · CONJUNTO · NUBE',
    colors: ['#FCF5F4', '#CCDEEA', '#EEC5BA'], sizes: ['0-3m', '3-6m', '6-12m'],
    isFeatured: false, sortOrder: 5,
  },
  {
    id: 'p06', slug: 'sweater-cuello-alto-tinta', name: 'Sweater Cuello Alto Tinta',
    categoryId: 'sweaters', price: 96000, oldPrice: null, status: null, stock: 3,
    materials: 'Lana merino · 100%',
    description: 'Cuello alto, manga larga, calce ajustado. Hilado fino para usar bajo abrigo.',
    placeholder: 'SWEATER · TURTLENECK · TINTA',
    colors: ['#36160E', '#1E2D37', '#4D4A47'], sizes: ['S', 'M', 'L'],
    isFeatured: false, sortOrder: 6,
  },
  {
    id: 'p07', slug: 'almohadon-telar', name: 'Almohadón Telar',
    categoryId: 'home', price: 42000, oldPrice: null, status: null, stock: 8,
    materials: 'Lana · funda removible',
    description: 'Almohadón con punto telar combinado, base de lino crudo en el reverso.',
    placeholder: 'HOME · ALMOHADÓN · TELAR',
    colors: ['#CB674C', '#DBD7D3'], sizes: ['45x45'],
    isFeatured: false, sortOrder: 7,
  },
  {
    id: 'p08', slug: 'gorro-cable-azul', name: 'Gorro Cable Azul Polvo',
    categoryId: 'accesorios', price: 28000, oldPrice: null, status: null, stock: 9,
    materials: 'Lana merino',
    description: 'Gorro tejido con punto cable, doble vuelta. Ajuste cómodo.',
    placeholder: 'GORRO · CABLE · AZUL',
    colors: ['#6C95B0', '#537389', '#DBD7D3'], sizes: ['Única'],
    isFeatured: false, sortOrder: 8,
  },
  {
    id: 'p09', slug: 'cardigan-largo-tweed', name: 'Cardigan Largo Tweed',
    categoryId: 'cardigans', price: 134000, oldPrice: null, status: 'new', stock: 2,
    materials: 'Lana · poliamida 15%',
    description: 'Cardigan largo hasta la rodilla, punto tweed con motas naturales. Bolsillos parcheados.',
    placeholder: 'CARDIGAN · LARGO · TWEED',
    colors: ['#653022', '#36160E'], sizes: ['M', 'L'],
    isFeatured: false, sortOrder: 9,
  },
  {
    id: 'p10', slug: 'manta-bebe-cuna', name: 'Manta Bebé Cuna',
    categoryId: 'bebes', price: 78000, oldPrice: null, status: 'bestseller', stock: 4,
    materials: 'Algodón orgánico',
    description: 'Manta para cuna en punto pop-corn, súper suave. Bordes en festón.',
    placeholder: 'BEBÉ · MANTA CUNA · POPCORN',
    colors: ['#FCF5F4', '#EEC5BA', '#CCDEEA'], sizes: ['80x100'],
    isFeatured: false, sortOrder: 10,
  },
  {
    id: 'p11', slug: 'mitones-lana-cruda', name: 'Mitones Lana Cruda',
    categoryId: 'accesorios', price: 22000, oldPrice: null, status: null, stock: 12,
    materials: 'Lana sin teñir',
    description: 'Mitones sin dedos, punto canalé, ideales para días de viento.',
    placeholder: 'MITONES · CANALÉ · CRUDO',
    colors: ['#DBD7D3', '#B7B0A9'], sizes: ['S/M', 'L'],
    isFeatured: false, sortOrder: 11,
  },
  {
    id: 'p12', slug: 'sweater-granny-patchwork', name: 'Sweater Granny Patchwork',
    categoryId: 'sweaters', price: 128000, oldPrice: null, status: 'new', stock: 1,
    materials: 'Lana · acrílico premium',
    description: 'Sweater patchwork con cuadros granny tejidos individualmente. Pieza única numerada.',
    placeholder: 'SWEATER · GRANNY · PATCHWORK',
    colors: ['#CB674C', '#6C95B0', '#595421'], sizes: ['Única M'],
    isFeatured: false, sortOrder: 12,
  },
];

async function main() {
  console.log('→ Seeding categorías…');
  await db
    .insert(categories)
    .values(seedCategories)
    .onConflictDoNothing({ target: categories.id });

  console.log('→ Seeding productos…');
  await db
    .insert(products)
    .values(seedProducts)
    .onConflictDoNothing({ target: products.id });

  console.log('→ Seeding imágenes de productos…');
  const productIds = seedProducts.map((p) => p.id!);
  await db
    .delete(productImages)
    .where(inArray(productImages.productId, productIds));

  const altSuffixes = [
    'vista frontal',
    'detalle del tejido',
    'en uso',
    'vista trasera',
  ] as const;
  const imagesToInsert: NewProductImage[] = seedProducts.flatMap((p) =>
    altSuffixes.map((suffix, i) => ({
      productId: p.id!,
      url: `/img/placeholder/${p.slug}-${i + 1}.svg`,
      alt: `${p.name} — ${suffix}`,
      sortOrder: i,
      isHero: i === 0,
    }))
  );
  await db.insert(productImages).values(imagesToInsert);

  const [{ catCount }] = await db.execute<{ catCount: number }>(
    "select count(*)::int as \"catCount\" from categories"
  ).then((r) => r.rows) as [{ catCount: number }];
  const [{ prodCount }] = await db.execute<{ prodCount: number }>(
    "select count(*)::int as \"prodCount\" from products"
  ).then((r) => r.rows) as [{ prodCount: number }];
  const [{ imgCount }] = await db.execute<{ imgCount: number }>(
    "select count(*)::int as \"imgCount\" from product_images"
  ).then((r) => r.rows) as [{ imgCount: number }];

  console.log('→ Seeding admin user…');
  const adminHash = await hashPassword('tejido2026');
  await db
    .insert(users)
    .values({
      email: 'admin@betinadiluzio.com',
      name: 'Lili',
      role: 'admin',
      passwordHash: adminHash,
    })
    .onConflictDoNothing({ target: users.email });

  console.log(`✓ Listo. ${catCount} categorías, ${prodCount} productos, ${imgCount} imágenes.`);
}

main()
  .catch((err) => {
    console.error('✗ Seed falló:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
