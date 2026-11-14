// PWA アイコン（192 / 512px）をローカルで生成する。外部サービスは使わない。
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const SIZES = [192, 512]
const SAMPLES = 4

const FELT = [0x2f, 0x5d, 0x3f]
const DIE = [0xff, 0xfd, 0xf7]
const SUMI = [0x1c, 0x1a, 0x17]
const SHU = [0xc1, 0x27, 0x2d]

/** 中心 (0,0) の角丸四角の内側か。 */
function insideRoundedSquare(x, y, half, radius) {
  const dx = Math.max(Math.abs(x) - (half - radius), 0)
  const dy = Math.max(Math.abs(y) - (half - radius), 0)
  return dx * dx + dy * dy <= radius * radius
}

/** 単位座標（-0.5〜0.5）の点の色。マスカブルアイコンの安全域に収まるよう中央に描く。 */
function colorAt(x, y) {
  const dieHalf = 0.27
  if (x * x + y * y <= 0.12 * 0.12) return SHU
  if (insideRoundedSquare(x, y, dieHalf, 0.11)) return DIE
  if (insideRoundedSquare(x, y, dieHalf + 0.018, 0.125)) return SUMI
  return FELT
}

function renderIcon(size) {
  const png = new PNG({ width: size, height: size })
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const sum = [0, 0, 0]
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const x = (px + (sx + 0.5) / SAMPLES) / size - 0.5
          const y = (py + (sy + 0.5) / SAMPLES) / size - 0.5
          const [r, g, b] = colorAt(x, y)
          sum[0] += r
          sum[1] += g
          sum[2] += b
        }
      }
      const offset = (py * size + px) * 4
      const count = SAMPLES * SAMPLES
      png.data[offset] = Math.round(sum[0] / count)
      png.data[offset + 1] = Math.round(sum[1] / count)
      png.data[offset + 2] = Math.round(sum[2] / count)
      png.data[offset + 3] = 255
    }
  }
  return PNG.sync.write(png)
}

mkdirSync(OUT_DIR, { recursive: true })
for (const size of SIZES) {
  const file = join(OUT_DIR, `icon-${size}.png`)
  writeFileSync(file, renderIcon(size))
  console.log(`wrote ${file}`)
}
