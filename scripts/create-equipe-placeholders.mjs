#!/usr/bin/env node
/**
 * Gera placeholders otimizados (400×400, JPEG) para cada integrante da equipe.
 * Use como substituto até ter as fotos reais; depois substitua os arquivos e rode
 * npm run optimize-equipe.
 *
 * Uso: node scripts/create-equipe-placeholders.mjs
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EQUIPE_DIR = path.join(__dirname, '..', 'public', 'images', 'equipe')

const FILES = [
  'keise-barbosa.jpg',
  'jamila-marques.jpg',
  'leticia-carvalho.jpg',
  'mariana-andrade.jpg',
  'diego-mancha.jpg',
  'centrae.jpg',
  'sergio-monteiro.jpg',
  'joaninha-dias.jpg',
  'quilombo-cuieiras.jpg',
  'wassi-kamal.jpg',
  'edun-ara-sango.jpg',
  'tulio-seabra.jpg',
  'ubira-machado.jpg',
  'rebecka-santos.jpg',
  'daniel-lima.jpg',
  'maria-gesis.jpg'
]

const W = 400
const H = 400
const QUALITY = 82
const BG = { r: 232, g: 232, b: 232 } // cinza neutro claro (#e8e8e8)

async function createPlaceholder(file) {
  const outPath = path.join(EQUIPE_DIR, file)
  const buf = await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: BG
    }
  })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer()
  fs.writeFileSync(outPath, buf)
  return buf.length
}

async function main() {
  if (!fs.existsSync(EQUIPE_DIR)) fs.mkdirSync(EQUIPE_DIR, { recursive: true })
  console.log('📷 Gerando placeholders otimizados em public/images/equipe/...')
  for (const f of FILES) {
    const bytes = await createPlaceholder(f)
    console.log(`   ✅ ${f} (${(bytes / 1024).toFixed(1)} KB)`)
  }
  console.log('✅ Concluído. Substitua pelos arquivos reais e rode npm run optimize-equipe.')
}

main()
