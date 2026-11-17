// Генерує PNG-іконки для PWA без зовнішніх залежностей: PNG — це просто zlib-потік
// зі scanline-фільтром 0, тому пікселі рахуємо вручну, а кодуємо самі.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const outDirectory = path.join(process.cwd(), 'public', 'icons')
const background = [0x24, 0x5c, 0x4e]
const glyph = [0xf1, 0xff, 0xf8]

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const header = Buffer.alloc(8)
  header.writeUInt32BE(data.length, 0)
  header.write(type, 4, 'ascii')
  const trailer = Buffer.alloc(4)
  trailer.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), data])), 0)
  return Buffer.concat([header.subarray(0, 4), header.subarray(4), data, trailer])
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y += 1) pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Сигнальна вежа: точка-джерело, три дуги вгору і щогла вниз. Маскабельна версія
// вписує той самий малюнок у безпечну зону 60%, бо Android сам обріже коло.
function drawIcon(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4)
  const scale = size * (maskable ? 0.6 : 0.84)
  const originX = size / 2
  const originY = size * 0.5 + (size - scale) / 2
  const dotRadius = scale * 0.085
  const rings = [0.2, 0.33, 0.46].map((ratio) => scale * ratio)
  const ringWidth = scale * 0.062
  const mastTop = originY + dotRadius * 0.6
  const mastBottom = originY + scale * 0.5
  const mastWidth = scale * 0.055

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - originX
      const dy = y + 0.5 - originY
      const distance = Math.hypot(dx, dy)
      const up = dy <= 0

      let onGlyph = distance <= dotRadius
      if (!onGlyph && up) {
        for (const radius of rings) {
          const spread = Math.atan2(Math.abs(dx), -dy)
          if (Math.abs(distance - radius) <= ringWidth / 2 && spread <= Math.PI / 3.4) {
            onGlyph = true
            break
          }
        }
      }
      if (!onGlyph) {
        onGlyph = dy >= 0 && Math.abs(dx) <= mastWidth / 2 && dy <= mastBottom - originY && dy >= mastTop - originY
      }

      const index = (y * size + x) * 4
      const [red, green, blue] = onGlyph ? glyph : background
      pixels[index] = red
      pixels[index + 1] = green
      pixels[index + 2] = blue
      pixels[index + 3] = 255
    }
  }

  return pixels
}

mkdirSync(outDirectory, { recursive: true })

for (const size of [192, 512]) {
  writeFileSync(path.join(outDirectory, `icon-${size}.png`), encodePng(size, drawIcon(size, false)))
  writeFileSync(path.join(outDirectory, `maskable-icon-${size}.png`), encodePng(size, drawIcon(size, true)))
}
writeFileSync(path.join(outDirectory, 'apple-touch-icon.png'), encodePng(180, drawIcon(180, true)))

console.log('іконки PWA згенеровано в public/icons/')
