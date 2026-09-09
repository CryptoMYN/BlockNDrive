import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const scale = isMaskable ? 0.7 : 0.85;
  const shieldRadius = (width / 2) * scale;

  for (let y = 0; y < height; y++) {
    rawData.writeUInt8(0, offset++); // Filter byte: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background: Deep indigo to violet
      const gradT = (x + y) / (width + height);
      let r = Math.round(67 + gradT * (124 - 67));  // #4338ca -> #7c3aed
      let g = Math.round(56 + gradT * (58 - 56));
      let b = Math.round(202 + gradT * (237 - 202));
      let a = 255;

      // Inner shield / padlock shape
      if (Math.abs(dx) < shieldRadius * 0.65 && dy > -shieldRadius * 0.7 && dy < shieldRadius * 0.7) {
        // Shield body
        const shieldTop = -shieldRadius * 0.6;
        const shieldBottom = shieldRadius * 0.65;
        const curve = Math.pow(Math.abs(dx) / (shieldRadius * 0.65), 1.6);
        const maxY = shieldBottom - curve * (shieldRadius * 0.5);

        if (dy >= shieldTop && dy <= maxY) {
          // Inside shield: White/indigo
          r = 255;
          g = 255;
          b = 255;

          // Inside lock body
          if (Math.abs(dx) < shieldRadius * 0.28 && dy > -shieldRadius * 0.1 && dy < shieldRadius * 0.4) {
            r = 49;
            g = 46;
            b = 129; // #312e81
          }
          // Lock shackle
          const shackleDist = Math.sqrt(dx * dx + Math.pow(dy + shieldRadius * 0.15, 2));
          if (shackleDist > shieldRadius * 0.16 && shackleDist < shieldRadius * 0.28 && dy < -shieldRadius * 0.05) {
            r = 49;
            g = 46;
            b = 129;
          }
        }
      }

      rawData.writeUInt8(r, offset++);
      rawData.writeUInt8(g, offset++);
      rawData.writeUInt8(b, offset++);
      rawData.writeUInt8(a, offset++);
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, "pwa-maskable-512x512.png"), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, "favicon.ico"), createPng(64, 64, false));

console.log("Successfully generated PWA icon assets in /public!");
