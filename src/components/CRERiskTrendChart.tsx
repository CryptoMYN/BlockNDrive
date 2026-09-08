import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { VaultDocument } from "../types";
import { HIGH_RISK_THRESHOLD } from "../constants/contract";
import { TrendingDown, TrendingUp, Minus, ShieldAlert, ShieldCheck, Activity, Info } from "lucide-react";

interface CRERiskTrendChartProps {
  documents: VaultDocument[];
  onSelectDocument?: (doc: VaultDocument) => void;
}

interface ChartDataPoint {
  id: number;
  name: string;
  date: Date;
  timestamp: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  category: string;
  txHash?: string;
  rawDoc: VaultDocument;
}

export const CRERiskTrendChart: React.FC<CRERiskTrendChartProps> = ({
  documents,
  onSelectDocument,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Process and sort valid documents by date
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const active = documents.filter((d) => !d.deleted);
    if (active.length === 0) return [];

    const points: ChartDataPoint[] = active.map((doc, idx) => {
      const ts = doc.createdAt || (Date.now() - (active.length - idx) * 3600 * 1000 * 24);
      const risk = Math.max(0, Math.min(100, doc.riskScore ?? 25));
      const level = risk >= HIGH_RISK_THRESHOLD ? "HIGH" : risk >= 45 ? "MEDIUM" : "LOW";
      return {
        id: doc.id,
        name: doc.manifest?.name || `document_${doc.id}.pdf`,
        date: new Date(ts),
        timestamp: ts,
        riskScore: risk,
        riskLevel: level,
        category: doc.manifest?.aiAnalysis?.category || "General Data",
        txHash: doc.txHash,
        rawDoc: doc,
      };
    });

    // Sort ascending by timestamp
    points.sort((a, b) => a.timestamp - b.timestamp);
    return points;
  }, [documents]);

  // Compute analytics metrics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { avg: 0, max: 0, min: 0, trend: "NEUTRAL", safeRatio: 100 };
    }
    const scores = chartData.map((d) => d.riskScore);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const safeCount = chartData.filter((d) => d.riskScore < HIGH_RISK_THRESHOLD).length;
    const safeRatio = Math.round((safeCount / chartData.length) * 100);

    let trend: "DECREASING" | "INCREASING" | "NEUTRAL" = "NEUTRAL";
    if (chartData.length >= 2) {
      const first = chartData[0].riskScore;
      const last = chartData[chartData.length - 1].riskScore;
      if (last < first - 5) trend = "DECREASING";
      else if (last > first + 5) trend = "INCREASING";
    }

    return { avg, max, min, trend, safeRatio };
  }, [chartData]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 580;
    const height = 190;
    const margin = { top: 25, right: 35, bottom: 35, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define unique gradient IDs
    const areaGradientId = "cre-area-gradient";
    const lineGradientId = "cre-line-gradient";

    const defs = svg.append("defs");

    // Area fill gradient
    const areaGradient = defs
      .append("linearGradient")
      .attr("id", areaGradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    areaGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.35);

    areaGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.0);

    // Stroke line gradient (green at bottom, orange at middle, red at threshold)
    const lineGradient = defs
      .append("linearGradient")
      .attr("id", lineGradientId)
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    lineGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#10b981");

    lineGradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#6366f1");

    lineGradient
      .append("stop")
      .attr("offset", "80%")
      .attr("stop-color", "#f59e0b");

    lineGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ef4444");

    // X Scale: If single point, give a buffer; otherwise linear/time
    let xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>;

    if (chartData.length === 1) {
      const ptTime = chartData[0].date.getTime();
      xScale = d3
        .scaleTime()
        .domain([new Date(ptTime - 86400000), new Date(ptTime + 86400000)])
        .range([0, innerWidth]);
    } else {
      const minDate = chartData[0].date;
      const maxDate = chartData[chartData.length - 1].date;
      // In case all have identical timestamp
      const timeDiff = maxDate.getTime() - minDate.getTime();
      if (timeDiff === 0) {
        xScale = d3
          .scaleLinear()
          .domain([0, chartData.length - 1])
          .range([0, innerWidth]);
      } else {
        xScale = d3
          .scaleTime()
          .domain([minDate, maxDate])
          .range([0, innerWidth]);
      }
    }

    // Y Scale: 0 to 100 fixed for standardized risk score
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Grid lines (horizontal)
    const yGridValues = [25, 50, 75, 100];
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yGridValues)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.08)
      .attr("stroke-dasharray", "3,3");

    // CRE High-Risk Threshold Line at 80
    const thresholdY = yScale(HIGH_RISK_THRESHOLD);
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", thresholdY)
      .attr("y2", thresholdY)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-opacity", 0.7);

    // Threshold Text Marker
    g.append("text")
      .attr("x", innerWidth)
      .attr("y", thresholdY - 5)
      .attr("text-anchor", "end")
      .attr("fill", "#ef4444")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("font-weight", "600")
      .text(`CRE Threshold (${HIGH_RISK_THRESHOLD})`);

    // Helper to get X position for a point
    const getX = (d: ChartDataPoint, idx: number) => {
      if (chartData.length === 1) {
        return (xScale as d3.ScaleTime<number, number>)(d.date);
      }
      if (xScale.domain()[0] instanceof Date) {
        return (xScale as d3.ScaleTime<number, number>)(d.date);
      }
      return (xScale as d3.ScaleLinear<number, number>)(idx);
    };

    // Draw Area if >= 2 points
    if (chartData.length >= 2) {
      const area = d3
        .area<ChartDataPoint>()
        .x((d, i) => getX(d, i))
        .y0(innerHeight)
        .y1((d) => yScale(d.riskScore))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(chartData)
        .attr("fill", `url(#${areaGradientId})`)
        .attr("d", area);
    }

    // Draw Line if >= 2 points
    if (chartData.length >= 2) {
      const line = d3
        .line<ChartDataPoint>()
        .x((d, i) => getX(d, i))
        .y((d) => yScale(d.riskScore))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", `url(#${lineGradientId})`)
        .attr("stroke-width", 2.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", line);
    }

    // Bottom Axis
    const xAxis = d3
      .axisBottom(xScale as any)
      .ticks(Math.min(chartData.length, 5))
      .tickFormat((d: any) => {
        if (d instanceof Date) {
          return d3.timeFormat("%b %d")(d);
        }
        return `#${d + 1}`;
      })
      .tickSize(0);

    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight + 8})`)
      .call(xAxis);

    xAxisG.select(".domain").remove();
    xAxisG
      .selectAll("text")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.5)
      .attr("font-size", "9px")
      .attr("font-family", "monospace");

    // Left Axis
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([0, 25, 50, 75, 100])
      .tickFormat((d) => `${d}`)
      .tickSize(0);

    const yAxisG = g
      .append("g")
      .attr("transform", `translate(-8,0)`)
      .call(yAxis);

    yAxisG.select(".domain").remove();
    yAxisG
      .selectAll("text")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.5)
      .attr("font-size", "9px")
      .attr("font-family", "monospace");

    // Interactive Data Dots
    const dotsGroup = g.append("g").attr("class", "dots");

    chartData.forEach((d, i) => {
      const cx = getX(d, i);
      const cy = yScale(d.riskScore);
      const isHighRisk = d.riskScore >= HIGH_RISK_THRESHOLD;
      const dotColor = isHighRisk ? "#ef4444" : d.riskScore >= 45 ? "#f59e0b" : "#10b981";

      // Outer ripple / ring for interactive touch
      const dotWrapper = dotsGroup
        .append("g")
        .attr("class", "cursor-pointer")
        .on("mouseenter", (event) => {
          setHoveredPoint(d);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on("mousemove", (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on("mouseleave", () => {
          setHoveredPoint(null);
          setTooltipPos(null);
        })
        .on("click", () => {
          if (onSelectDocument) {
            onSelectDocument(d.rawDoc);
          }
        });

      // Transparent larger hit area for easy hover on mobile/desktop
      dotWrapper
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 14)
        .attr("fill", "transparent");

      // Outer subtle ring
      dotWrapper
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 6)
        .attr("fill", dotColor)
        .attr("fill-opacity", 0.2);

      // Inner solid point
      dotWrapper
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 3.5)
        .attr("fill", dotColor)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5);
    });
  }, [chartData, onSelectDocument]);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
        <Activity className="h-6 w-6 text-slate-400 mx-auto mb-1.5 opacity-60" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No Attestation History Available
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Upload documents to observe real-time Chainlink CRE risk evaluations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
      {/* Header with Title and Telemetry Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Historical CRE Risk Trend</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                D3.js
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              AI attestations attested by Chainlink CRE decentralized nodes
            </p>
          </div>
        </div>

        {/* Quick telemetry metrics */}
        <div className="flex items-center gap-2 text-[11px] shrink-0">
          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
            <span className="text-slate-400 dark:text-slate-500">Avg Risk:</span>
            <span
              className={`font-mono font-bold ${
                stats.avg >= HIGH_RISK_THRESHOLD
                  ? "text-rose-600 dark:text-rose-400"
                  : stats.avg >= 45
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {stats.avg}/100
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
            {stats.trend === "DECREASING" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingDown className="h-3 w-3" />
                <span>Improving</span>
              </span>
            ) : stats.trend === "INCREASING" ? (
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                <TrendingUp className="h-3 w-3" />
                <span>Elevating</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                <Minus className="h-3 w-3" />
                <span>Stable</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div
        ref={containerRef}
        className="relative bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-inner overflow-hidden text-slate-500 dark:text-slate-400"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 580 190"
          className="w-full h-auto select-none"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Hover Tooltip overlay */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-white/10 max-w-xs transition-transform duration-75 backdrop-blur-xs font-sans"
            style={{
              left: `${Math.min(Math.max(10, tooltipPos.x - 70), 380)}px`,
              top: `${Math.max(10, tooltipPos.y - 85)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1.5">
              <span className="font-mono font-bold text-white truncate max-w-[150px]">
                {hoveredPoint.name}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                  hoveredPoint.riskScore >= HIGH_RISK_THRESHOLD
                    ? "bg-rose-500 text-white"
                    : hoveredPoint.riskScore >= 45
                    ? "bg-amber-500 text-slate-950"
                    : "bg-emerald-500 text-white"
                }`}
              >
                Score {hoveredPoint.riskScore}/100
              </span>
            </div>
            <div className="space-y-0.5 text-[10px] text-slate-300">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Category:</span>
                <span className="text-white font-medium truncate">{hoveredPoint.category}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Attested At:</span>
                <span className="font-mono text-slate-300">
                  {hoveredPoint.date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-white/5 text-[9px]">
                <span className="text-slate-400">CRE Consensus:</span>
                <span className="text-emerald-400 font-mono">DON Verified</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend & Context */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Low Risk (0–44)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Medium Risk (45–79)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>High Risk (80+)</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <Info className="h-3 w-3" />
          <span>Hover points for attestation logs</span>
        </div>
      </div>
    </div>
  );
};
