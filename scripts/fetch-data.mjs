// Ambil ulang data produk & harga OTR dari API publik astra-honda.com
// lalu simpan ke src/data/motors.json.  Jalankan: npm run fetch-data
import { writeFile } from 'node:fs/promises'

const API = 'https://www.astra-honda.com/api/v1'
const CATEGORIES = ['matic', 'cub', 'sport', 'ev', 'bigbike']
const headers = { 'User-Agent': 'Mozilla/5.0 (simulasi-kredit-honda)', Accept: 'application/json' }

async function get(path) {
  const res = await fetch(API + path, { headers })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return res.json()
}

const products = await get('/product')

// harga per tipe/varian
const variantsBySlug = {}
for (const cat of CATEGORIES) {
  let brands = []
  try { brands = await get(`/product/price/${cat}`) } catch (e) { console.warn('skip', cat, e.message) }
  for (const b of brands) {
    for (const t of b.types || []) {
      const slug = t.product?.slug
      const price = t.price_value || t.price?.price?.value || 0
      if (!slug || !price) continue
      ;(variantsBySlug[slug] ??= []).push({ name: t.name, price })
    }
  }
}

const out = []
for (const p of products) {
  if (!p.slug || p.slug === 'null' || !p.prices?.value) continue
  let detail = {}
  try { detail = await get(`/product/${p.slug}`) } catch { /* pakai data list */ }
  const colors = (detail.colors || p.colors || []).map((c) => ({
    name: c.title.split(',')[0].trim(),
    image: c.image,
  }))
  const variants = variantsBySlug[p.slug]?.length
    ? variantsBySlug[p.slug]
    : [{ name: p.title, price: p.prices.value }]
  out.push({ slug: p.slug, name: p.title, category: p.category.title, thumbnail: p.thumbnail, colors, variants })
  console.log(`✓ ${p.title} (${variants.length} tipe, ${colors.length} warna)`)
}

await writeFile(new URL('../src/data/motors.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`\nTersimpan ${out.length} model ke src/data/motors.json`)
