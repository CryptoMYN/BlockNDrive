import type {
  PerformanceStepMetric,
  UploadPerformanceMetrics,
  NetworkSpeedGrade,
} from "../types";

/**
 * Format raw bytes into human readable format (B, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds into a clean readable string
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1) return "< 1 ms";
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`;
  const seconds = (durationMs / 1000).toFixed(2);
  return `${seconds} s`;
}

/**
 * Calculate throughput in Megabytes/second and generate human-readable string
 */
export function calculateThroughput(
  bytes: number,
  durationMs: number
): { mbps: number; formatted: string } {
  if (!bytes || durationMs <= 0) {
    return { mbps: 0, formatted: "0 KB/s" };
  }
  const seconds = durationMs / 1000;
  if (seconds <= 0) {
    return { mbps: 0, formatted: "0 KB/s" };
  }
  const bytesPerSecond = bytes / seconds;
  const mbps = parseFloat((bytesPerSecond / (1024 * 1024)).toFixed(2));

  let formatted = "";
  if (bytesPerSecond >= 1024 * 1024) {
    formatted = `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
  } else if (bytesPerSecond >= 1024) {
    formatted = `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    formatted = `${Math.round(bytesPerSecond)} B/s`;
  }

  return { mbps, formatted };
}

/**
 * Categorize network speed based on upload throughput in MB/s
 */
export function assessNetworkSpeed(throughputMBps: number): {
  grade: NetworkSpeedGrade;
  label: string;
  advice: string;
} {
  if (throughputMBps >= 10.0) {
    return {
      grade: "ultra_fast",
      label: "⚡ Ultra-Fast Broadband (>10 MB/s)",
      advice: "Optimal high-bandwidth connection. Zero latency impact.",
    };
  } else if (throughputMBps >= 3.0) {
    return {
      grade: "fast",
      label: "🚀 High Speed (3 - 10 MB/s)",
      advice: "Fast fiber / 5G network. Immediate IPFS node receipt.",
    };
  } else if (throughputMBps >= 1.0) {
    return {
      grade: "moderate",
      label: "🟢 Stable Broadband (1 - 3 MB/s)",
      advice: "Standard broadband connection. Solid IPFS propagation.",
    };
  } else if (throughputMBps >= 0.25) {
    return {
      grade: "slow",
      label: "🟠 Slow Network (250 KB/s - 1 MB/s)",
      advice: "Slower mobile or congested network. Chunks were buffered and verified reliably.",
    };
  } else {
    return {
      grade: "very_slow",
      label: "🐢 Constrained Bandwidth (<250 KB/s)",
      advice: "High latency detected. Automated chunking and gateway retry safeguards preserved data integrity.",
    };
  }
}

/**
 * Performance Tracker for tracking micro-benchmarks during Document Uploads
 */
export class UploadPerformanceTracker {
  private fileSizeBytes: number;
  private fileName: string;
  private startTime: number;
  private steps: Map<string, PerformanceStepMetric> = new Map();
  private onUpdate?: (metrics: UploadPerformanceMetrics, activeStep?: PerformanceStepMetric) => void;

  constructor(
    fileSizeBytes: number,
    fileName: string,
    onUpdate?: (metrics: UploadPerformanceMetrics, activeStep?: PerformanceStepMetric) => void
  ) {
    this.fileSizeBytes = fileSizeBytes;
    this.fileName = fileName;
    this.startTime = performance.now();
    this.onUpdate = onUpdate;
  }

  public startStep(
    id: string,
    name: string,
    category: PerformanceStepMetric["category"],
    details?: string
  ): void {
    const now = performance.now();
    const metric: PerformanceStepMetric = {
      id,
      name,
      category,
      startTime: now,
      durationMs: 0,
      status: "running",
      details,
    };
    this.steps.set(id, metric);
    this.notify(metric);
  }

  public updateStepDetails(id: string, details: string): void {
    const step = this.steps.get(id);
    if (step) {
      step.details = details;
      step.durationMs = performance.now() - step.startTime;
      this.notify(step);
    }
  }

  public endStep(
    id: string,
    bytesProcessed?: number,
    details?: string
  ): PerformanceStepMetric | undefined {
    const step = this.steps.get(id);
    if (!step) return undefined;

    const now = performance.now();
    step.endTime = now;
    step.durationMs = Math.max(1, now - step.startTime);
    step.status = "completed";
    if (details) step.details = details;

    if (bytesProcessed !== undefined && bytesProcessed > 0) {
      step.bytesProcessed = bytesProcessed;
      const { mbps, formatted } = calculateThroughput(bytesProcessed, step.durationMs);
      step.throughputMBps = mbps;
      step.throughputFormatted = formatted;
    }

    this.notify(step);
    return step;
  }

  public failStep(id: string, errorMessage: string): void {
    const step = this.steps.get(id);
    if (step) {
      const now = performance.now();
      step.endTime = now;
      step.durationMs = Math.max(1, now - step.startTime);
      step.status = "failed";
      step.details = errorMessage;
      this.notify(step);
    }
  }

  public getMetrics(): UploadPerformanceMetrics {
    const totalDurationMs = Math.max(1, performance.now() - this.startTime);
    const stepList = Array.from(this.steps.values());

    const encStep = this.steps.get("aes_encryption");
    const ipfsStep = this.steps.get("ipfs_upload");
    const ipfsVerifyStep = this.steps.get("ipfs_verify");
    const aiStep = this.steps.get("chainlink_cre_ai");
    const litStep = this.steps.get("lit_key_sealing");
    const contractStep = this.steps.get("contract_minting");

    const encryptionDurationMs = encStep?.durationMs || 0;
    const encryptionThroughputMBps = encStep?.throughputMBps || 0;
    const encryptionThroughputFormatted = encStep?.throughputFormatted || "0 KB/s";

    const ipfsUploadDurationMs = ipfsStep?.durationMs || 0;
    const ipfsThroughputMBps = ipfsStep?.throughputMBps || 0;
    const ipfsThroughputFormatted = ipfsStep?.throughputFormatted || "0 KB/s";

    const ipfsVerificationDurationMs = ipfsVerifyStep?.durationMs || 0;
    const aiAnalysisDurationMs = aiStep?.durationMs || 0;
    const litSealingDurationMs = litStep?.durationMs || 0;
    const blockchainMiningDurationMs = contractStep?.durationMs || 0;

    const { grade, label, advice } = assessNetworkSpeed(ipfsThroughputMBps);

    return {
      totalDurationMs,
      fileSizeBytes: this.fileSizeBytes,
      encryptedSizeBytes: encStep?.bytesProcessed || this.fileSizeBytes,
      encryptionDurationMs,
      encryptionThroughputMBps,
      encryptionThroughputFormatted,
      ipfsUploadDurationMs,
      ipfsThroughputMBps,
      ipfsThroughputFormatted,
      ipfsVerificationDurationMs,
      aiAnalysisDurationMs,
      litSealingDurationMs,
      blockchainMiningDurationMs,
      networkGrade: grade,
      networkGradeLabel: label,
      networkAdvice: advice,
      steps: stepList,
      completedAt: Date.now(),
    };
  }

  private notify(activeStep?: PerformanceStepMetric): void {
    if (this.onUpdate) {
      try {
        this.onUpdate(this.getMetrics(), activeStep);
      } catch {
        // ignore callback errors
      }
    }
  }

  /**
   * Produce formatted ASCII diagnostic summary
   */
  public generateReportText(metrics?: UploadPerformanceMetrics): string {
    const m = metrics || this.getMetrics();
    const lines = [
      `=================================================================`,
      ` BlockNDrive Operation Benchmark & Performance Log`,
      `=================================================================`,
      `File Name:          ${this.fileName}`,
      `Original Size:      ${formatBytes(m.fileSizeBytes)} (${m.fileSizeBytes} bytes)`,
      `Encrypted Size:     ${formatBytes(m.encryptedSizeBytes)}`,
      `Total Elapsed:      ${formatDuration(m.totalDurationMs)}`,
      `Network Speed:      ${m.networkGradeLabel}`,
      `Network Advice:     ${m.networkAdvice}`,
      `-----------------------------------------------------------------`,
      `Granular Step Breakdown:`,
    ];

    for (const s of m.steps) {
      const throughputText = s.throughputFormatted ? ` [${s.throughputFormatted}]` : "";
      const bar = generateAsciiBar(s.durationMs, m.totalDurationMs, 20);
      lines.push(
        `• ${s.name.padEnd(28)} : ${formatDuration(s.durationMs).padStart(9)}${throughputText.padStart(14)}  ${bar} (${s.status.toUpperCase()})`
      );
      if (s.details) {
        lines.push(`    └─ ${s.details}`);
      }
    }

    lines.push(`=================================================================`);
    return lines.join("\n");
  }
}

function generateAsciiBar(duration: number, total: number, maxChars: number = 20): string {
  if (total <= 0) return "[                    ]";
  const ratio = Math.min(1, Math.max(0, duration / total));
  const filled = Math.round(ratio * maxChars);
  const empty = maxChars - filled;
  return `[${"#".repeat(filled)}${"-".repeat(empty)}] ${(ratio * 100).toFixed(0)}%`;
}
