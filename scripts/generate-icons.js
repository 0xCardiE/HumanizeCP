const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const iconsDir = path.join(__dirname, "..", "icons");
const color = { r: 45, g: 90, b: 61 };

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3;
      const edge = x < 2 || y < 2 || x >= size - 2 || y >= size - 2;
      const letter =
        size >= 32 &&
        ((x >= size * 0.28 && x <= size * 0.38 && y >= size * 0.22 && y <= size * 0.78) ||
          (x >= size * 0.58 && x <= size * 0.68 && y >= size * 0.22 && y <= size * 0.78) ||
          (x >= size * 0.28 && x <= size * 0.68 && y >= size * 0.44 && y <= size * 0.56));
      const highlight = letter || edge;
      raw[px] = highlight ? Math.min(255, color.r + 40) : color.r;
      raw[px + 1] = highlight ? Math.min(255, color.g + 40) : color.g;
      raw[px + 2] = highlight ? Math.min(255, color.b + 40) : color.b;
    }
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 48, 128]) {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), createPng(size));
}
console.log("Generated icons in icons/");
