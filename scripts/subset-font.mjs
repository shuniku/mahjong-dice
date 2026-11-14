// Noto Serif JP を、アプリで使う文字だけにサブセット化して public/fonts に出力する。
// 元のフォントは scripts/.font-cache にダウンロードする（ビルド時のみ。実行時の通信はない）。
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = join(ROOT, 'scripts', '.font-cache')
const OUT_DIR = join(ROOT, 'public', 'fonts')
const SOURCE_BASE = 'https://github.com/notofonts/noto-cjk/raw/main/Serif'
const WEIGHTS = ['Regular', 'Bold']
const EXTRA_TEXT = '0123456789 ：・（）－…人打ち東南西北割振'

function collectSourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? collectSourceFiles(path) : [path]
  })
}

/** コメントの文字までフォントに入れないよう、ソースからコメントを除く。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/ .*$/gm, '')
}

function collectText() {
  const files = [...collectSourceFiles(join(ROOT, 'src')), join(ROOT, 'index.html')]
  const text = files.map((file) => stripComments(readFileSync(file, 'utf8'))).join('')
  const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')
  return Array.from(new Set(ascii + EXTRA_TEXT + text)).join('')
}

async function loadSource(weight) {
  const file = join(CACHE_DIR, `NotoSerifJP-${weight}.otf`)
  if (!existsSync(file)) {
    mkdirSync(CACHE_DIR, { recursive: true })
    const url = `${SOURCE_BASE}/SubsetOTF/JP/NotoSerifJP-${weight}.otf`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`download failed (${response.status}): ${url}`)
    writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  }
  return readFileSync(file)
}

mkdirSync(OUT_DIR, { recursive: true })
const text = collectText()
for (const weight of WEIGHTS) {
  const subset = await subsetFont(await loadSource(weight), text, {
    targetFormat: 'woff2',
    noLayoutClosure: true,
  })
  const out = join(OUT_DIR, `NotoSerifJP-${weight}.subset.woff2`)
  writeFileSync(out, subset)
  console.log(`wrote ${out} (${subset.length} bytes, ${text.length} characters)`)
}
