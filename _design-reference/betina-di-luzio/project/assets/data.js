/* ============================================
   Mock catalog — ready to migrate to Astro/Next
   ============================================ */
window.BDL_CATEGORIES = [
  { id: 'sweaters', name: 'Sweaters', slug: 'sweaters', count: 12, blurb: 'Calidez tejida para cada estación.' },
  { id: 'cardigans', name: 'Cardigans', slug: 'cardigans', count: 8, blurb: 'Capas suaves, hechas para abrazar.' },
  { id: 'mantas', name: 'Mantas & Throws', slug: 'mantas', count: 6, blurb: 'Texturas para descansar.' },
  { id: 'accesorios', name: 'Accesorios', slug: 'accesorios', count: 14, blurb: 'Bufandas, gorros, mitones.' },
  { id: 'bebes', name: 'Bebés', slug: 'bebes', count: 9, blurb: 'Primeras prendas, pura ternura.' },
  { id: 'home', name: 'Living', slug: 'home', count: 5, blurb: 'Almohadones, tapices, detalles.' },
];

window.BDL_PRODUCTS = [
  { id: 'p01', name: 'Sweater Otoño Terracota', slug: 'sweater-otono-terracota', cat: 'sweaters', price: 89000, oldPrice: null, status: 'new', stock: 4, materials: 'Lana merino · 100%', colors: ['#CB674C', '#36160E', '#DBD7D3'], sizes: ['S','M','L'], desc: 'Sweater de punto trenzado, tejido a dos agujas. Cuello redondo, mangas largas con detalle de canalé. Pieza única.', placeholder: 'SWEATER · TRENZADO · TERRACOTA' },
  { id: 'p02', name: 'Cardigan Esencial Crema', slug: 'cardigan-esencial-crema', cat: 'cardigans', price: 102000, oldPrice: 120000, status: 'sale', stock: 2, materials: 'Algodón pima · Lana 30%', colors: ['#FCF5F4', '#EEC5BA', '#6C95B0'], sizes: ['S','M','L','XL'], desc: 'Cardigan oversize con botones de madera. Punto suave que se adapta al cuerpo.', placeholder: 'CARDIGAN · OVERSIZE · CREMA' },
  { id: 'p03', name: 'Manta Rosario', slug: 'manta-rosario', cat: 'mantas', price: 145000, oldPrice: null, status: 'bestseller', stock: 3, materials: 'Lana de oveja · sin teñir', colors: ['#DBD7D3', '#918B85'], sizes: ['Única 140x180'], desc: 'Manta tejida en crochet, punto granny gigante. Bordes con flecos hechos a mano.', placeholder: 'MANTA · GRANNY · CRUDO' },
  { id: 'p04', name: 'Bufanda Trama Olivo', slug: 'bufanda-trama-olivo', cat: 'accesorios', price: 38000, oldPrice: null, status: null, stock: 6, materials: 'Lana merino · 100%', colors: ['#595421', '#36160E', '#984C37'], sizes: ['Única 200x30'], desc: 'Bufanda de canalé inglés, abriga sin pesar.', placeholder: 'BUFANDA · CANALÉ · OLIVO' },
  { id: 'p05', name: 'Conjunto Bebé Nube', slug: 'conjunto-bebe-nube', cat: 'bebes', price: 64000, oldPrice: null, status: 'new', stock: 5, materials: 'Algodón pima · hipoalergénico', colors: ['#FCF5F4', '#CCDEEA', '#EEC5BA'], sizes: ['0-3m','3-6m','6-12m'], desc: 'Conjunto de body, gorrito y escarpines. Tejido con punto suave para piel sensible.', placeholder: 'BEBÉ · CONJUNTO · NUBE' },
  { id: 'p06', name: 'Sweater Cuello Alto Tinta', slug: 'sweater-cuello-alto-tinta', cat: 'sweaters', price: 96000, oldPrice: null, status: null, stock: 3, materials: 'Lana merino · 100%', colors: ['#36160E', '#1E2D37', '#4D4A47'], sizes: ['S','M','L'], desc: 'Cuello alto, manga larga, calce ajustado. Hilado fino para usar bajo abrigo.', placeholder: 'SWEATER · TURTLENECK · TINTA' },
  { id: 'p07', name: 'Almohadón Telar', slug: 'almohadon-telar', cat: 'home', price: 42000, oldPrice: null, status: null, stock: 8, materials: 'Lana · funda removible', colors: ['#CB674C', '#DBD7D3'], sizes: ['45x45'], desc: 'Almohadón con punto telar combinado, base de lino crudo en el reverso.', placeholder: 'HOME · ALMOHADÓN · TELAR' },
  { id: 'p08', name: 'Gorro Cable Azul Polvo', slug: 'gorro-cable-azul', cat: 'accesorios', price: 28000, oldPrice: null, status: null, stock: 9, materials: 'Lana merino', colors: ['#6C95B0', '#537389', '#DBD7D3'], sizes: ['Única'], desc: 'Gorro tejido con punto cable, doble vuelta. Ajuste cómodo.', placeholder: 'GORRO · CABLE · AZUL' },
  { id: 'p09', name: 'Cardigan Largo Tweed', slug: 'cardigan-largo-tweed', cat: 'cardigans', price: 134000, oldPrice: null, status: 'new', stock: 2, materials: 'Lana · poliamida 15%', colors: ['#653022', '#36160E'], sizes: ['M','L'], desc: 'Cardigan largo hasta la rodilla, punto tweed con motas naturales. Bolsillos parcheados.', placeholder: 'CARDIGAN · LARGO · TWEED' },
  { id: 'p10', name: 'Manta Bebé Cuna', slug: 'manta-bebe-cuna', cat: 'bebes', price: 78000, oldPrice: null, status: 'bestseller', stock: 4, materials: 'Algodón orgánico', colors: ['#FCF5F4', '#EEC5BA', '#CCDEEA'], sizes: ['80x100'], desc: 'Manta para cuna en punto pop-corn, súper suave. Bordes en festón.', placeholder: 'BEBÉ · MANTA CUNA · POPCORN' },
  { id: 'p11', name: 'Mitones Lana Cruda', slug: 'mitones-lana-cruda', cat: 'accesorios', price: 22000, oldPrice: null, status: null, stock: 12, materials: 'Lana sin teñir', colors: ['#DBD7D3', '#B7B0A9'], sizes: ['S/M','L'], desc: 'Mitones sin dedos, punto canalé, ideales para días de viento.', placeholder: 'MITONES · CANALÉ · CRUDO' },
  { id: 'p12', name: 'Sweater Granny Patchwork', slug: 'sweater-granny-patchwork', cat: 'sweaters', price: 128000, oldPrice: null, status: 'new', stock: 1, materials: 'Lana · acrílico premium', colors: ['#CB674C', '#6C95B0', '#595421'], sizes: ['Única M'], desc: 'Sweater patchwork con cuadros granny tejidos individualmente. Pieza única numerada.', placeholder: 'SWEATER · GRANNY · PATCHWORK' },
];

window.BDLgetProduct = (id) => window.BDL_PRODUCTS.find(p => p.id === id || p.slug === id);
