/**
 * BlockNDrive Geometric Pattern Image Generator
 * Generates dynamic, algorithmic geometric image placeholders representing specific file types.
 */

export interface PatternResult {
  dataUrl: string;
  patternName: string;
  category: string;
  fileExtension: string;
  dominantColor: string;
  accentColor: string;
  dimensions: { width: number; height: number };
  seed: number;
}

export type FileCategory =
  | "pdf"
  | "image"
  | "code"
  | "document"
  | "audio_video"
  | "archive_secure"
  | "generic";

interface CategoryTheme {
  name: string;
  badge: string;
  bgDark: string;
  bgLight: string;
  palette: string[];
  patterns: ("isometric_grid" | "concentric_rings" | "hex_lattice" | "diagonal_chevrons" | "tessellated_triangles" | "geometric_circuit")[];
}

const CATEGORY_THEMES: Record<FileCategory, CategoryTheme> = {
  pdf: {
    name: "PDF Document",
    badge: "PDF",
    bgDark: "#1a0b0e",
    bgLight: "#ffeef0",
    palette: ["#e11d48", "#be123c", "#f43f5e", "#fda4af", "#881337"],
    patterns: ["isometric_grid", "diagonal_chevrons", "tessellated_triangles"],
  },
  image: {
    name: "Visual Image Asset",
    badge: "IMG",
    bgDark: "#0e111a",
    bgLight: "#f0f4ff",
    palette: ["#6366f1", "#8b5cf6", "#ec4899", "#38bdf8", "#a855f7"],
    patterns: ["concentric_rings", "tessellated_triangles", "isometric_grid"],
  },
  code: {
    name: "Code & Structured Data",
    badge: "DATA",
    bgDark: "#061311",
    bgLight: "#ecfdf5",
    palette: ["#10b981", "#059669", "#06b6d4", "#14b8a6", "#34d399"],
    patterns: ["hex_lattice", "geometric_circuit", "isometric_grid"],
  },
  document: {
    name: "Text Document",
    badge: "DOC",
    bgDark: "#0c1322",
    bgLight: "#eff6ff",
    palette: ["#2563eb", "#3b82f6", "#60a5fa", "#1d4ed8", "#93c5fd"],
    patterns: ["diagonal_chevrons", "isometric_grid", "tessellated_triangles"],
  },
  audio_video: {
    name: "Audio / Video Media",
    badge: "MEDIA",
    bgDark: "#150d22",
    bgLight: "#faf5ff",
    palette: ["#9333ea", "#a855f7", "#c084fc", "#7e22ce", "#e879f9"],
    patterns: ["concentric_rings", "geometric_circuit", "diagonal_chevrons"],
  },
  archive_secure: {
    name: "Encrypted Archive / Key",
    badge: "SECURE",
    bgDark: "#1c1407",
    bgLight: "#fffbeb",
    palette: ["#f59e0b", "#d97706", "#b45309", "#fbbf24", "#78350f"],
    patterns: ["hex_lattice", "tessellated_triangles", "isometric_grid"],
  },
  generic: {
    name: "Binary Vault File",
    badge: "VAULT",
    bgDark: "#0f172a",
    bgLight: "#f1f5f9",
    palette: ["#475569", "#64748b", "#334155", "#94a3b8", "#1e293b"],
    patterns: ["isometric_grid", "hex_lattice", "concentric_rings"],
  },
};

/**
 * Identify the category from file name and MIME type
 */
export function detectFileCategory(fileName: string, mimeType?: string): { category: FileCategory; extension: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = (mimeType || "").toLowerCase();

  if (ext === "pdf" || mime.includes("pdf")) {
    return { category: "pdf", extension: "pdf" };
  }
  if (
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext) ||
    mime.startsWith("image/")
  ) {
    return { category: "image", extension: ext || "img" };
  }
  if (
    ["json", "js", "ts", "jsx", "tsx", "py", "sol", "rs", "go", "java", "c", "cpp", "html", "css", "yaml", "yml", "xml"].includes(ext) ||
    mime.includes("json") ||
    mime.includes("javascript") ||
    mime.includes("typescript")
  ) {
    return { category: "code", extension: ext || "code" };
  }
  if (
    ["doc", "docx", "txt", "rtf", "md", "csv", "xls", "xlsx"].includes(ext) ||
    mime.startsWith("text/") ||
    mime.includes("word") ||
    mime.includes("document")
  ) {
    return { category: "document", extension: ext || "doc" };
  }
  if (
    ["mp3", "wav", "flac", "ogg", "mp4", "webm", "mov", "m4a"].includes(ext) ||
    mime.startsWith("audio/") ||
    mime.startsWith("video/")
  ) {
    return { category: "audio_video", extension: ext || "media" };
  }
  if (
    ["zip", "tar", "gz", "7z", "rar", "enc", "key", "pem"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("compressed")
  ) {
    return { category: "archive_secure", extension: ext || "enc" };
  }

  return { category: "generic", extension: ext || "bin" };
}

// Simple seeded pseudo-random number generator for deterministic reproducible patterns
function pseudoRandom(seed: number) {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

/**
 * Image Generator Function
 * Procedurally draws a geometric pattern representing the file type onto a canvas,
 * returning a high-resolution PNG Data URL.
 */
export function generateGeometricPlaceholder(params: {
  fileName: string;
  mimeType?: string;
  width?: number;
  height?: number;
  customSeed?: number;
}): PatternResult {
  const { fileName, mimeType, width = 360, height = 220 } = params;
  const { category, extension } = detectFileCategory(fileName, mimeType);
  const theme = CATEGORY_THEMES[category];

  // Derive initial seed from fileName and optional custom seed
  let seed = params.customSeed ?? Math.floor(Math.random() * 100000);
  if (params.customSeed === undefined) {
    // Generate derived seed from filename characters + random salt
    let hash = 0;
    for (let i = 0; i < fileName.length; i++) {
      hash = (hash << 5) - hash + fileName.charCodeAt(i);
      hash |= 0;
    }
    seed = Math.abs(hash) + Math.floor(Math.random() * 9999);
  }

  // Create canvas in memory (client-side)
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return {
      dataUrl: "",
      patternName: "Fallback Pattern",
      category: theme.name,
      fileExtension: extension.toUpperCase(),
      dominantColor: theme.palette[0],
      accentColor: theme.palette[1],
      dimensions: { width, height },
      seed,
    };
  }

  // Pick pattern type based on seed and category available patterns
  const patternIndex = Math.floor(pseudoRandom(seed) * theme.patterns.length);
  const selectedPattern = theme.patterns[patternIndex];

  // 1. Draw subtle background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgDark);
  bgGrad.addColorStop(1, "#030712");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw subtle geometric background grid / wireframe
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Draw algorithmic geometric patterns
  let currentSeed = seed;
  const nextRand = () => {
    currentSeed += 1.37;
    return pseudoRandom(currentSeed);
  };

  const palette = theme.palette;

  if (selectedPattern === "isometric_grid") {
    // Isometric 3D cubes / rhombuses
    const cubeSize = 32;
    const cols = Math.ceil(width / cubeSize) + 2;
    const rows = Math.ceil(height / (cubeSize * 0.8)) + 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (nextRand() > 0.45) continue; // Sparse artistic distribution

        const cx = c * cubeSize * 1.5 + (r % 2) * (cubeSize * 0.75);
        const cy = r * cubeSize * 0.86;
        const color = palette[Math.floor(nextRand() * palette.length)];

        // Top rhombus
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + nextRand() * 0.45;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cubeSize * 0.5);
        ctx.lineTo(cx + cubeSize * 0.6, cy - cubeSize * 0.2);
        ctx.lineTo(cx, cy + cubeSize * 0.1);
        ctx.lineTo(cx - cubeSize * 0.6, cy - cubeSize * 0.2);
        ctx.closePath();
        ctx.fill();

        // Left face
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2 + nextRand() * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx - cubeSize * 0.6, cy - cubeSize * 0.2);
        ctx.lineTo(cx, cy + cubeSize * 0.1);
        ctx.lineTo(cx, cy + cubeSize * 0.6);
        ctx.lineTo(cx - cubeSize * 0.6, cy + cubeSize * 0.3);
        ctx.closePath();
        ctx.fill();

        // Right face
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5 + nextRand() * 0.35;
        ctx.beginPath();
        ctx.moveTo(cx, cy + cubeSize * 0.1);
        ctx.lineTo(cx + cubeSize * 0.6, cy - cubeSize * 0.2);
        ctx.lineTo(cx + cubeSize * 0.6, cy + cubeSize * 0.3);
        ctx.lineTo(cx, cy + cubeSize * 0.6);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (selectedPattern === "concentric_rings") {
    // Concentric rings and orbital arcs
    const centerX = width * 0.5 + (nextRand() - 0.5) * 60;
    const centerY = height * 0.5 + (nextRand() - 0.5) * 40;
    const ringCount = 14;

    for (let i = 1; i <= ringCount; i++) {
      const radius = i * 16;
      const color = palette[i % palette.length];
      const startAngle = nextRand() * Math.PI * 2;
      const arcLength = Math.PI * (0.6 + nextRand() * 1.2);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + arcLength);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 + nextRand() * 4;
      ctx.globalAlpha = 0.25 + nextRand() * 0.55;
      ctx.stroke();

      // Satellite circle node
      if (nextRand() > 0.4) {
        const nodeAngle = startAngle + arcLength;
        const nx = centerX + Math.cos(nodeAngle) * radius;
        const ny = centerY + Math.sin(nodeAngle) * radius;
        ctx.beginPath();
        ctx.arc(nx, ny, 3 + nextRand() * 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
    }
  } else if (selectedPattern === "hex_lattice") {
    // Interlocking hexagon honeycomb with glowing centers
    const hexRadius = 26;
    const xDist = hexRadius * Math.sqrt(3);
    const yDist = hexRadius * 1.5;

    for (let y = -hexRadius; y < height + hexRadius * 2; y += yDist) {
      const rowIdx = Math.floor(y / yDist);
      const xOffset = (rowIdx % 2) * (xDist / 2);

      for (let x = -hexRadius; x < width + hexRadius * 2; x += xDist) {
        if (nextRand() > 0.55) continue;

        const posX = x + xOffset;
        const posY = y;
        const color = palette[Math.floor(nextRand() * palette.length)];

        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a + Math.PI / 6;
          const hx = posX + hexRadius * Math.cos(angle);
          const hy = posY + hexRadius * Math.sin(angle);
          if (a === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.15 + nextRand() * 0.35;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + nextRand() * 0.4;
        ctx.stroke();

        // Hexagon center dot
        if (nextRand() > 0.3) {
          ctx.beginPath();
          ctx.arc(posX, posY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = 0.85;
          ctx.fill();
        }
      }
    }
  } else if (selectedPattern === "diagonal_chevrons") {
    // Dynamic intersecting chevrons & diagonal ribbons
    const ribbonCount = 18;
    const stripeWidth = 14;

    for (let i = 0; i < ribbonCount; i++) {
      const xStart = (i - 4) * 32 + (nextRand() - 0.5) * 20;
      const color = palette[i % palette.length];
      const alpha = 0.2 + nextRand() * 0.45;

      ctx.beginPath();
      ctx.moveTo(xStart, 0);
      ctx.lineTo(xStart + stripeWidth, 0);
      ctx.lineTo(xStart + stripeWidth + height * 0.8, height);
      ctx.lineTo(xStart + height * 0.8, height);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Counter-diagonal chevron
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(width - xStart, 0);
        ctx.lineTo(width - (xStart + stripeWidth), 0);
        ctx.lineTo(width - (xStart + stripeWidth + height * 0.8), height);
        ctx.lineTo(width - (xStart + height * 0.8), height);
        ctx.closePath();
        ctx.fillStyle = palette[(i + 2) % palette.length];
        ctx.globalAlpha = 0.2;
        ctx.fill();
      }
    }
  } else if (selectedPattern === "tessellated_triangles") {
    // Delaunay-style polygon triangles
    const pointCols = 7;
    const pointRows = 5;
    const points: [number, number][][] = [];

    for (let r = 0; r <= pointRows; r++) {
      points[r] = [];
      for (let c = 0; c <= pointCols; c++) {
        const jitterX = (nextRand() - 0.5) * 35;
        const jitterY = (nextRand() - 0.5) * 25;
        points[r][c] = [
          (c / pointCols) * width + jitterX,
          (r / pointRows) * height + jitterY,
        ];
      }
    }

    for (let r = 0; r < pointRows; r++) {
      for (let c = 0; c < pointCols; c++) {
        const p1 = points[r][c];
        const p2 = points[r][c + 1];
        const p3 = points[r + 1][c];
        const p4 = points[r + 1][c + 1];

        // Triangle 1
        const col1 = palette[Math.floor(nextRand() * palette.length)];
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fillStyle = col1;
        ctx.globalAlpha = 0.2 + nextRand() * 0.4;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.stroke();

        // Triangle 2
        const col2 = palette[Math.floor(nextRand() * palette.length)];
        ctx.beginPath();
        ctx.moveTo(p2[0], p2[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fillStyle = col2;
        ctx.globalAlpha = 0.2 + nextRand() * 0.4;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.stroke();
      }
    }
  } else {
    // Geometric circuit / tech motherboard paths
    const nodeCount = 28;
    ctx.strokeStyle = palette[0];
    ctx.lineWidth = 2;

    for (let i = 0; i < nodeCount; i++) {
      const x1 = Math.floor(nextRand() * 12) * (width / 12);
      const y1 = Math.floor(nextRand() * 8) * (height / 8);
      const x2 = x1 + (nextRand() > 0.5 ? 40 : -40);
      const y2 = y1 + (nextRand() > 0.5 ? 40 : -40);

      const color = palette[Math.floor(nextRand() * palette.length)];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4 + nextRand() * 0.4;
      ctx.stroke();

      // Terminal node
      ctx.beginPath();
      ctx.arc(x2, y2, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
    }
  }

  // 4. Central File Type Watermark Badge
  ctx.globalAlpha = 1.0;
  const badgeWidth = 140;
  const badgeHeight = 54;
  const badgeX = (width - badgeWidth) / 2;
  const badgeY = (height - badgeHeight) / 2;

  // Badge Glass Card
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const radius = 12;
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
  ctx.fill();
  ctx.stroke();

  // Accent line on badge top
  const lineGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY);
  lineGrad.addColorStop(0, palette[0]);
  lineGrad.addColorStop(1, palette[1] || palette[0]);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(badgeX + 16, badgeY);
  ctx.lineTo(badgeX + badgeWidth - 16, badgeY);
  ctx.stroke();

  // Badge Typography
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const displayExt = extension ? extension.toUpperCase() : theme.badge;
  ctx.fillText(`[ ${displayExt} ]`, width / 2, badgeY + 22);

  ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
  ctx.font = "600 10px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText(theme.name.toUpperCase(), width / 2, badgeY + 39);
  ctx.restore();

  // 5. Subtle bottom tech watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "right";
  ctx.fillText(`GEO-GEN // SEED #${seed.toString(16).toUpperCase()}`, width - 12, height - 10);

  ctx.textAlign = "left";
  ctx.fillText(`${width}x${height} ALGORITHMIC PLACEHOLDER`, 12, height - 10);

  const patternHumanName = selectedPattern
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    dataUrl: canvas.toDataURL("image/png"),
    patternName: patternHumanName,
    category: theme.name,
    fileExtension: displayExt,
    dominantColor: palette[0],
    accentColor: palette[1] || palette[0],
    dimensions: { width, height },
    seed,
  };
}
