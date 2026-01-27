#!/usr/bin/env node
/**
 * Otimiza imagens em public/images/equipe/ para web:
 * - Redimensiona para no máx. 400×400 (mantém proporção)
 * - Comprime (JPEG quality 82; PNG com compressão)
 * - Sobrescreve os arquivos originais
 *
 * Uso: node scripts/optimize-equipe-images.mjs
 * Ou:  npm run optimize-equipe
 *
 * Coloque as fotos em public/images/equipe/ com os nomes corretos antes de rodar.
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EQUIPE_DIR = path.join(__dirname, '..', 'public', 'images', 'equipe')

const MAX_SIZE = 400
const JPEG_QUALITY = 82

const EXT = ['.jpg', '.jpeg', '.png', '.webp']

async function optimizeEquipeImages() {
  if (!fs.existsSync(EQUIPE_DIR)) {
    console.error('❌ Pasta não encontrada:', EQUIPE_DIR)
    process.exit(1)
  }

  const files = fs.readdirSync(EQUIPE_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase()
    return EXT.includes(ext)
  })

  if (files.length === 0) {
    console.log('⚠️ Nenhuma imagem em', EQUIPE_DIR)
    console.log('   Coloque as fotos (jpg/png) e rode novamente.')
    return
  }

  console.log(`📷 Otimizando ${files.length} imagem(ns) em public/images/equipe/...`)

  for (const file of files) {
    const inputPath = path.join(EQUIPE_DIR, file)
    const ext = path.extname(file).toLowerCase()
    const base = path.basename(file, ext)
    const outPath = path.join(EQUIPE_DIR, base + '.jpg')
    const tmpPath = path.join(EQUIPE_DIR, base + '.tmp.jpg')

    try {
      const pipeline = sharp(inputPath)
        .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })

      await pipeline.toFile(tmpPath)
      if (inputPath !== outPath) fs.unlinkSync(inputPath)
      fs.renameSync(tmpPath, outPath)

      const stat = fs.statSync(outPath)
      console.log(`   ✅ ${base}.jpg (${(stat.size / 1024).toFixed(1)} KB)`)
    } catch (err) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
      console.error(`   ❌ ${file}:`, err.message)
    }
  }

  console.log('✅ Concluído.')
}

optimizeEquipeImages()
