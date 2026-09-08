import React from "react";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileVideo,
  FileAudio,
  FileKey,
  File,
  Lock,
} from "lucide-react";

export type DetectedFileType =
  | "pdf"
  | "image"
  | "spreadsheet"
  | "document"
  | "code"
  | "archive"
  | "audio"
  | "video"
  | "key"
  | "generic";

export interface FileVisualConfig {
  type: DetectedFileType;
  extension: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  accentHex: string;
}

/**
 * Returns distinct visual styling, icons, and badges for files based on extension & MIME type.
 */
export function getFileVisualConfig(fileName: string, mimeType?: string): FileVisualConfig {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = (mimeType || "").toLowerCase();

  // 1. PDF
  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      type: "pdf",
      extension: "PDF",
      label: "PDF Document",
      Icon: FileText,
      bgClass: "bg-rose-50 dark:bg-rose-950/60",
      borderClass: "border-rose-200/80 dark:border-rose-800/80",
      textClass: "text-rose-600 dark:text-rose-400",
      badgeClass: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      accentHex: "#e11d48",
    };
  }

  // 2. Images
  if (
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "ico", "tiff"].includes(ext) ||
    mime.startsWith("image/")
  ) {
    return {
      type: "image",
      extension: ext ? ext.toUpperCase() : "IMG",
      label: "Image",
      Icon: FileImage,
      bgClass: "bg-purple-50 dark:bg-purple-950/60",
      borderClass: "border-purple-200/80 dark:border-purple-800/80",
      textClass: "text-purple-600 dark:text-purple-400",
      badgeClass: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      accentHex: "#9333ea",
    };
  }

  // 3. Spreadsheets & Tables
  if (
    ["csv", "xls", "xlsx", "tsv", "ods"].includes(ext) ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("csv")
  ) {
    return {
      type: "spreadsheet",
      extension: ext ? ext.toUpperCase() : "XLS",
      label: "Spreadsheet",
      Icon: FileSpreadsheet,
      bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
      borderClass: "border-emerald-200/80 dark:border-emerald-800/80",
      textClass: "text-emerald-600 dark:text-emerald-400",
      badgeClass: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      accentHex: "#10b981",
    };
  }

  // 4. Code & Structured Data
  if (
    [
      "json", "js", "ts", "jsx", "tsx", "py", "sol", "rs", "go", "java", "c", "cpp",
      "h", "html", "css", "yaml", "yml", "xml", "sh", "sql", "graphql"
    ].includes(ext) ||
    mime.includes("json") ||
    mime.includes("javascript") ||
    mime.includes("typescript")
  ) {
    return {
      type: "code",
      extension: ext ? ext.toUpperCase() : "CODE",
      label: "Code & Data",
      Icon: FileCode,
      bgClass: "bg-cyan-50 dark:bg-cyan-950/60",
      borderClass: "border-cyan-200/80 dark:border-cyan-800/80",
      textClass: "text-cyan-600 dark:text-cyan-400",
      badgeClass: "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      accentHex: "#06b6d4",
    };
  }

  // 5. Text Documents & Word
  if (
    ["doc", "docx", "txt", "rtf", "md", "odt"].includes(ext) ||
    mime.startsWith("text/") ||
    mime.includes("word") ||
    mime.includes("officedocument")
  ) {
    return {
      type: "document",
      extension: ext ? ext.toUpperCase() : "DOC",
      label: "Text Document",
      Icon: FileText,
      bgClass: "bg-blue-50 dark:bg-blue-950/60",
      borderClass: "border-blue-200/80 dark:border-blue-800/80",
      textClass: "text-blue-600 dark:text-blue-400",
      badgeClass: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      accentHex: "#2563eb",
    };
  }

  // 6. Audio Files
  if (
    ["mp3", "wav", "flac", "ogg", "m4a", "aac", "wma"].includes(ext) ||
    mime.startsWith("audio/")
  ) {
    return {
      type: "audio",
      extension: ext ? ext.toUpperCase() : "AUDIO",
      label: "Audio File",
      Icon: FileAudio,
      bgClass: "bg-pink-50 dark:bg-pink-950/60",
      borderClass: "border-pink-200/80 dark:border-pink-800/80",
      textClass: "text-pink-600 dark:text-pink-400",
      badgeClass: "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
      accentHex: "#ec4899",
    };
  }

  // 7. Video Files
  if (
    ["mp4", "webm", "mov", "avi", "mkv", "wmv", "flv"].includes(ext) ||
    mime.startsWith("video/")
  ) {
    return {
      type: "video",
      extension: ext ? ext.toUpperCase() : "VIDEO",
      label: "Video File",
      Icon: FileVideo,
      bgClass: "bg-violet-50 dark:bg-violet-950/60",
      borderClass: "border-violet-200/80 dark:border-violet-800/80",
      textClass: "text-violet-600 dark:text-violet-400",
      badgeClass: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      accentHex: "#8b5cf6",
    };
  }

  // 8. Cryptographic Keys & Certificates
  if (["key", "pem", "crt", "cer", "pfx", "p12", "pub"].includes(ext)) {
    return {
      type: "key",
      extension: ext ? ext.toUpperCase() : "KEY",
      label: "Security Key",
      Icon: FileKey,
      bgClass: "bg-amber-50 dark:bg-amber-950/60",
      borderClass: "border-amber-200/80 dark:border-amber-800/80",
      textClass: "text-amber-600 dark:text-amber-400",
      badgeClass: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      accentHex: "#f59e0b",
    };
  }

  // 9. Archives & Compressed packages
  if (
    ["zip", "tar", "gz", "7z", "rar", "bz2", "xz"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("compressed") ||
    mime.includes("tar")
  ) {
    return {
      type: "archive",
      extension: ext ? ext.toUpperCase() : "ZIP",
      label: "Archive",
      Icon: FileArchive,
      bgClass: "bg-amber-50 dark:bg-amber-950/60",
      borderClass: "border-amber-200/80 dark:border-amber-800/80",
      textClass: "text-amber-600 dark:text-amber-400",
      badgeClass: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      accentHex: "#d97706",
    };
  }

  // 10. Generic Encrypted File
  return {
    type: "generic",
    extension: ext ? ext.toUpperCase() : "BIN",
    label: "Encrypted Vault File",
    Icon: ext === "enc" ? Lock : File,
    bgClass: "bg-indigo-50 dark:bg-indigo-950/60",
    borderClass: "border-indigo-200/80 dark:border-indigo-800/80",
    textClass: "text-indigo-600 dark:text-indigo-400",
    badgeClass: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    accentHex: "#6366f1",
  };
}
