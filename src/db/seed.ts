import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]!] ??= m[2]!.replace(/^["']|["']$/g, '');
  }
} catch {}

const { db, pool } = await import('./client.ts');
import { inArray } from 'drizzle-orm';
import {
  categories,
  products,
  productImages,
  users,
  coupons,
  contentBlocks,
  customColors,
} from './schema.ts';
import type {
  NewCategory,
  NewProduct,
  NewProductImage,
  NewCoupon,
  NewContentBlock,
  NewCustomColor,
} from './schema.ts';
import { COLOR_NAMES } from '../lib/colors.ts';
const { hashPassword } = await import('../lib/auth.ts');

const seedPaletteColors: NewCustomColor[] = Object.entries(COLOR_NAMES).map(
  ([hex, name]) => ({ hex, name })
);

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
    id: 'p01', slug: 'sweater-otono-terracota', sku: 'SW-001', name: 'Sweater Otoño Terracota',
    categoryId: 'sweaters', price: 89000, oldPrice: null, status: 'new', stock: 4,
    materials: 'Lana merino · 100%',
    description: 'Sweater de punto trenzado, tejido a dos agujas. Cuello redondo, mangas largas con detalle de canalé. Pieza única.',
    placeholder: 'SWEATER · TRENZADO · TERRACOTA',
    colors: ['#CB674C', '#36160E', '#DBD7D3'], sizes: ['S', 'M', 'L'],
    isFeatured: true, sortOrder: 1,
  },
  {
    id: 'p02', slug: 'cardigan-esencial-crema', sku: 'CA-002', name: 'Cardigan Esencial Crema',
    categoryId: 'cardigans', price: 102000, oldPrice: 120000, status: 'sale', stock: 2,
    materials: 'Algodón pima · Lana 30%',
    description: 'Cardigan oversize con botones de madera. Punto suave que se adapta al cuerpo.',
    placeholder: 'CARDIGAN · OVERSIZE · CREMA',
    colors: ['#FCF5F4', '#EEC5BA', '#6C95B0'], sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: true, sortOrder: 2,
  },
  {
    id: 'p03', slug: 'manta-rosario', sku: 'MA-003', name: 'Manta Rosario',
    categoryId: 'mantas', price: 145000, oldPrice: null, status: 'bestseller', stock: 3,
    materials: 'Lana de oveja · sin teñir',
    description: 'Manta tejida en crochet, punto granny gigante. Bordes con flecos hechos a mano.',
    placeholder: 'MANTA · GRANNY · CRUDO',
    colors: ['#DBD7D3', '#918B85'], sizes: ['Única 140x180'],
    isFeatured: true, sortOrder: 3,
  },
  {
    id: 'p04', slug: 'bufanda-trama-olivo', sku: 'AC-004', name: 'Bufanda Trama Olivo',
    categoryId: 'accesorios', price: 38000, oldPrice: null, status: null, stock: 6,
    materials: 'Lana merino · 100%',
    description: 'Bufanda de canalé inglés, abriga sin pesar.',
    placeholder: 'BUFANDA · CANALÉ · OLIVO',
    colors: ['#595421', '#36160E', '#984C37'], sizes: ['Única 200x30'],
    isFeatured: true, sortOrder: 4,
  },
  {
    id: 'p05', slug: 'conjunto-bebe-nube', sku: 'BE-005', name: 'Conjunto Bebé Nube',
    categoryId: 'bebes', price: 64000, oldPrice: null, status: 'new', stock: 5,
    materials: 'Algodón pima · hipoalergénico',
    description: 'Conjunto de body, gorrito y escarpines. Tejido con punto suave para piel sensible.',
    placeholder: 'BEBÉ · CONJUNTO · NUBE',
    colors: ['#FCF5F4', '#CCDEEA', '#EEC5BA'], sizes: ['0-3m', '3-6m', '6-12m'],
    isFeatured: false, sortOrder: 5,
  },
  {
    id: 'p06', slug: 'sweater-cuello-alto-tinta', sku: 'SW-006', name: 'Sweater Cuello Alto Tinta',
    categoryId: 'sweaters', price: 96000, oldPrice: null, status: null, stock: 3,
    materials: 'Lana merino · 100%',
    description: 'Cuello alto, manga larga, calce ajustado. Hilado fino para usar bajo abrigo.',
    placeholder: 'SWEATER · TURTLENECK · TINTA',
    colors: ['#36160E', '#1E2D37', '#4D4A47'], sizes: ['S', 'M', 'L'],
    isFeatured: false, sortOrder: 6,
  },
  {
    id: 'p07', slug: 'almohadon-telar', sku: 'HO-007', name: 'Almohadón Telar',
    categoryId: 'home', price: 42000, oldPrice: null, status: null, stock: 8,
    materials: 'Lana · funda removible',
    description: 'Almohadón con punto telar combinado, base de lino crudo en el reverso.',
    placeholder: 'HOME · ALMOHADÓN · TELAR',
    colors: ['#CB674C', '#DBD7D3'], sizes: ['45x45'],
    isFeatured: false, sortOrder: 7,
  },
  {
    id: 'p08', slug: 'gorro-cable-azul', sku: 'AC-008', name: 'Gorro Cable Azul Polvo',
    categoryId: 'accesorios', price: 28000, oldPrice: null, status: null, stock: 9,
    materials: 'Lana merino',
    description: 'Gorro tejido con punto cable, doble vuelta. Ajuste cómodo.',
    placeholder: 'GORRO · CABLE · AZUL',
    colors: ['#6C95B0', '#537389', '#DBD7D3'], sizes: ['Única'],
    isFeatured: false, sortOrder: 8,
  },
  {
    id: 'p09', slug: 'cardigan-largo-tweed', sku: 'CA-009', name: 'Cardigan Largo Tweed',
    categoryId: 'cardigans', price: 134000, oldPrice: null, status: 'new', stock: 2,
    materials: 'Lana · poliamida 15%',
    description: 'Cardigan largo hasta la rodilla, punto tweed con motas naturales. Bolsillos parcheados.',
    placeholder: 'CARDIGAN · LARGO · TWEED',
    colors: ['#653022', '#36160E'], sizes: ['M', 'L'],
    isFeatured: false, sortOrder: 9,
  },
  {
    id: 'p10', slug: 'manta-bebe-cuna', sku: 'BE-010', name: 'Manta Bebé Cuna',
    categoryId: 'bebes', price: 78000, oldPrice: null, status: 'bestseller', stock: 4,
    materials: 'Algodón orgánico',
    description: 'Manta para cuna en punto pop-corn, súper suave. Bordes en festón.',
    placeholder: 'BEBÉ · MANTA CUNA · POPCORN',
    colors: ['#FCF5F4', '#EEC5BA', '#CCDEEA'], sizes: ['80x100'],
    isFeatured: false, sortOrder: 10,
  },
  {
    id: 'p11', slug: 'mitones-lana-cruda', sku: 'AC-011', name: 'Mitones Lana Cruda',
    categoryId: 'accesorios', price: 22000, oldPrice: null, status: null, stock: 12,
    materials: 'Lana sin teñir',
    description: 'Mitones sin dedos, punto canalé, ideales para días de viento.',
    placeholder: 'MITONES · CANALÉ · CRUDO',
    colors: ['#DBD7D3', '#B7B0A9'], sizes: ['S/M', 'L'],
    isFeatured: false, sortOrder: 11,
  },
  {
    id: 'p12', slug: 'sweater-granny-patchwork', sku: 'SW-012', name: 'Sweater Granny Patchwork',
    categoryId: 'sweaters', price: 128000, oldPrice: null, status: 'new', stock: 1,
    materials: 'Lana · acrílico premium',
    description: 'Sweater patchwork con cuadros granny tejidos individualmente. Pieza única numerada.',
    placeholder: 'SWEATER · GRANNY · PATCHWORK',
    colors: ['#CB674C', '#6C95B0', '#595421'], sizes: ['Única M'],
    isFeatured: false, sortOrder: 12,
  },
];

const seedCoupons: NewCoupon[] = [
  {
    code: 'OTONO20',
    kind: 'percent',
    value: 20,
    minPurchase: 0,
    scope: 'all',
    expiresAt: new Date('2026-05-30T23:59:59Z'),
    maxUses: 50,
    usedCount: 14,
    isActive: true,
  },
  {
    code: 'PRIMERACOMPRA',
    kind: 'fixed',
    value: 10000,
    minPurchase: 50000,
    scope: 'all',
    maxUses: null,
    usedCount: 9,
    isActive: true,
  },
  {
    code: 'BEBE15',
    kind: 'percent',
    value: 15,
    minPurchase: 0,
    scope: 'category',
    categoryId: 'bebes',
    expiresAt: new Date('2026-06-15T23:59:59Z'),
    maxUses: 30,
    usedCount: 3,
    isActive: true,
  },
  {
    code: 'ENVIOGRATIS',
    kind: 'free_shipping',
    value: 0,
    minPurchase: 80000,
    scope: 'all',
    expiresAt: new Date('2026-06-30T23:59:59Z'),
    maxUses: 100,
    usedCount: 2,
    isActive: true,
  },
  {
    code: 'VERANO10',
    kind: 'percent',
    value: 10,
    minPurchase: 0,
    scope: 'all',
    expiresAt: new Date('2026-02-28T23:59:59Z'),
    maxUses: 50,
    usedCount: 22,
    isActive: false,
  },
];

const seedContent: NewContentBlock[] = [
  // Hero
  { key: 'home.hero.title1', section: 'home', label: 'Hero · Línea 1', kind: 'text', value: 'Cada punto' },
  { key: 'home.hero.title2', section: 'home', label: 'Hero · Línea 2 (cursiva)', kind: 'text', value: 'una historia' },
  { key: 'home.hero.subtitle', section: 'home', label: 'Hero · Subtítulo', kind: 'rich',
    value: 'Prendas tejidas a mano, en crochet y dos agujas. Diseños únicos, hechos a tu medida — con la calma y el cariño que sólo el tiempo puede dar.' },
  { key: 'home.hero.cta_primary', section: 'home', label: 'Hero · CTA principal', kind: 'text', value: 'Explorar la tienda' },
  { key: 'home.hero.cta_secondary', section: 'home', label: 'Hero · CTA secundario', kind: 'text', value: 'Conocé a Betina' },
  // Hero images (gestionables desde admin)
  { key: 'home.hero.image1', section: 'home', label: 'Hero · Imagen 1 (grande izq.)', kind: 'image', value: '' },
  { key: 'home.hero.image2', section: 'home', label: 'Hero · Imagen 2 (centro)', kind: 'image', value: '' },
  { key: 'home.hero.image3', section: 'home', label: 'Hero · Imagen 3 (derecha)', kind: 'image', value: '' },
  // Marquee
  { key: 'home.marquee', section: 'home', label: 'Marquee · frases (separadas por · )', kind: 'rich',
    value: 'Cada prenda es única · Hecho en Rosario · Tejido a mano · Lana natural · Desde 2011 · A medida' },
  { key: 'home.marquee.enabled', section: 'home', label: 'Marquee · mostrar', kind: 'text', value: 'true' },
  // Story (Lili)
  { key: 'home.story.eyebrow', section: 'home', label: 'Story · Eyebrow', kind: 'text', value: '— Manos de Lili Di Luzio' },
  { key: 'home.story.title', section: 'home', label: 'Story · Título', kind: 'text', value: 'Cada pieza guarda una pausa.' },
  { key: 'home.story.body', section: 'home', label: 'Story · Texto', kind: 'rich',
    value: 'Tejo desde 2011 en Rosario. Lana, dos agujas, crochet, paciencia. Cada prenda lleva el tiempo que necesita — y eso se nota cuando la usás.' },
  { key: 'home.story.image', section: 'home', label: 'Story · Imagen retrato (4:5)', kind: 'image', value: '' },
  // Process steps
  { key: 'home.process.step1_title', section: 'home', label: 'Proceso · Paso 1 título', kind: 'text', value: 'Escribime' },
  { key: 'home.process.step1_body', section: 'home', label: 'Proceso · Paso 1 texto', kind: 'text', value: 'Charlamos por WhatsApp sobre lo que imaginás, talles, materiales y tiempos.' },
  { key: 'home.process.step2_title', section: 'home', label: 'Proceso · Paso 2 título', kind: 'text', value: 'Tejo a tu medida' },
  { key: 'home.process.step2_body', section: 'home', label: 'Proceso · Paso 2 texto', kind: 'text', value: 'Una vez confirmado, empiezo. Te mando fotos del proceso si querés.' },
  { key: 'home.process.step3_title', section: 'home', label: 'Proceso · Paso 3 título', kind: 'text', value: 'Tejido a mano' },
  { key: 'home.process.step3_body', section: 'home', label: 'Proceso · Paso 3 texto', kind: 'text', value: 'Empieza el ritual. Cada prenda lleva entre 2 y 6 semanas, según complejidad.' },
  { key: 'home.process.step4_title', section: 'home', label: 'Proceso · Paso 4 título', kind: 'text', value: 'Llega a vos' },
  { key: 'home.process.step4_body', section: 'home', label: 'Proceso · Paso 4 texto', kind: 'text', value: 'Coordinamos envío a todo el país o retiro en Rosario. La prenda viaja con instrucciones.' },
  // CTA bottom
  { key: 'home.cta.title', section: 'home', label: 'CTA · Título', kind: 'text', value: '¿Tenés algo en mente?' },
  { key: 'home.cta.subtitle', section: 'home', label: 'CTA · Bajada', kind: 'text',
    value: 'Pedidos a medida, regalos especiales, primera prenda de bebé. Escribime y armamos lo que imaginás.' },
  { key: 'home.cta.bg', section: 'home', label: 'CTA · Color de fondo (hex)', kind: 'text', value: '#CB674C' },
  // Nosotros — titulares
  { key: 'about.h1', section: 'about', label: 'Nosotros · H1', kind: 'rich', value: 'El tejido como <em>forma de meditar.</em>' },
  { key: 'about.lede', section: 'about', label: 'Nosotros · Lede', kind: 'text',
    value: 'Soy Lili Di Luzio. Tejer me llena de calma, me conecta con mi mamá y mi abuela, y me deja una parte mía en cada prenda.' },
  // Nosotros — portrait images
  { key: 'about.portrait1', section: 'about', label: 'Nosotros · Retrato 1 (Lili tejiendo, 3:4)', kind: 'image', value: '' },
  { key: 'about.portrait2', section: 'about', label: 'Nosotros · Retrato 2 (Manos · hilo, 3:4)', kind: 'image', value: '' },
  { key: 'about.portrait3', section: 'about', label: 'Nosotros · Retrato 3 (Taller, 3:4)', kind: 'image', value: '' },
  // Footer
  { key: 'footer.tagline', section: 'footer', label: 'Footer · Tagline', kind: 'text',
    value: 'Tejidos artesanales hechos a mano · Rosario · Argentina · Desde 2011' },
  // SEO defaults
  { key: 'seo.default_title_suffix', section: 'seo', label: 'SEO · Sufijo de título', kind: 'text', value: 'Betina Di Luzio' },
  { key: 'seo.default_description', section: 'seo', label: 'SEO · Descripción default', kind: 'text',
    value: 'Tejidos artesanales en crochet y dos agujas — prendas únicas hechas a mano en Rosario, Argentina.' },
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

  console.log('→ Seeding cupones…');
  await db
    .insert(coupons)
    .values(seedCoupons)
    .onConflictDoNothing({ target: coupons.code });

  console.log('→ Seeding bloques de contenido…');
  for (const block of seedContent) {
    await db
      .insert(contentBlocks)
      .values(block)
      .onConflictDoNothing({ target: contentBlocks.key });
  }

  console.log('→ Seeding paleta de colores…');
  await db
    .insert(customColors)
    .values(seedPaletteColors)
    .onConflictDoNothing({ target: customColors.hex });

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
