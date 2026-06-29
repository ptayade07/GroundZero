/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DashboardMetrics, Category } from "../types";
import { ShieldCheck, HelpCircle, Activity, BarChart3, AlertCircle, Map, Search, Flame } from "lucide-react";

interface AnalyticsDashboardProps {
  metrics: DashboardMetrics | null;
}

const CATEGORY_ICONS: Record<Category, string> = {
  "Civic Issue": "🏢",
  "Pothole": "🕳️",
  "Flooding": "🌊",
  "Power Cut": "🔌",
  "Garbage": "🗑️",
  "Corruption": "💼",
  "Government Failure": "🏛️",
  "Protest / Rally": "📣",
  "Local Drama": "🍵",
  "Argument / Dispute": "🗣️",
  "Harassment": "⚠️",
  "Breaking News": "📰",
  "Village Problem": "🏡",
  "Weather": "☁️",
  "War / Conflict": "💥",
  "Other": "❓"
};

const CATEGORY_NAMES: Record<Category, string> = {
  "Civic Issue": "Civic Issue",
  "Pothole": "Pothole",
  "Flooding": "Flooding & Waterlogging",
  "Power Cut": "Power Cut / Outage",
  "Garbage": "Garbage & Waste",
  "Corruption": "Corruption & Graft",
  "Government Failure": "Government Failure",
  "Protest / Rally": "Protest / Rally",
  "Local Drama": "Local Drama",
  "Argument / Dispute": "Argument / Dispute",
  "Harassment": "Harassment",
  "Breaking News": "Breaking News",
  "Village Problem": "Village Problem",
  "Weather": "Weather Conditions",
  "War / Conflict": "War / Conflict",
  "Other": "Other"
};

const CATEGORY_COLORS: Record<Category, string> = {
  "Civic Issue": "bg-indigo-500",
  "Pothole": "bg-orange-500",
  "Flooding": "bg-blue-500",
  "Power Cut": "bg-yellow-500",
  "Garbage": "bg-amber-700",
  "Corruption": "bg-red-500",
  "Government Failure": "bg-red-700",
  "Protest / Rally": "bg-pink-500",
  "Local Drama": "bg-teal-500",
  "Argument / Dispute": "bg-rose-500",
  "Harassment": "bg-red-600",
  "Breaking News": "bg-cyan-500",
  "Village Problem": "bg-green-500",
  "Weather": "bg-sky-500",
  "War / Conflict": "bg-gray-700",
  "Other": "bg-gray-500"
};

export default function AnalyticsDashboard({ metrics }: AnalyticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2">
        <Activity className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono uppercase tracking-widest text-brand">Compiling radar metrics...</p>
      </div>
    );
  }

  const resolutionRate = metrics.totalIssues > 0
    ? Math.round((metrics.resolvedCount / metrics.totalIssues) * 100)
    : 0;

  // Filter area metrics based on search term
  const filteredAreas = Object.entries(metrics.byArea).filter(([areaName]) =>
    areaName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0A0A0A]/95 border border-gray-900 rounded-xl p-4 md:p-6 text-white space-y-6 overflow-y-auto max-h-[85vh] scrollbar-none" id="analytics-dashboard-view">
      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-brand tracking-tight flex items-center gap-2">
          <Activity className="w-4 h-4" />
          MUNICIPAL IMPACT RADAR
        </h2>
        <p className="text-[10px] text-gray-400 font-mono uppercase">CIVIC RESOLUTION & ENGAGEMENT STATISTICS</p>
      </div>

      {/* Grid: 3 core counters */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-[#0A0A0A] border border-gray-900 rounded-lg">
          <p className="text-xl font-black text-white font-mono">{metrics.totalIssues}</p>
          <p className="text-[8px] text-gray-500 font-mono uppercase tracking-wide mt-1">TOTAL FILED</p>
        </div>
        <div className="p-3 bg-brand/5 border border-brand/20 rounded-lg">
          <p className="text-xl font-black text-brand font-mono">{metrics.unresolvedCount}</p>
          <p className="text-[8px] text-gray-400 font-mono uppercase tracking-wide mt-1">ACTIVE ISSUES</p>
        </div>
        <div className="p-3 bg-green-950/20 border border-green-500/30 rounded-lg">
          <p className="text-xl font-black text-green-400 font-mono">{metrics.resolvedCount}</p>
          <p className="text-[8px] text-gray-400 font-mono uppercase tracking-wide mt-1">RESOLVED</p>
        </div>
      </div>

      {/* Circle resolution meter */}
      <div className="flex items-center gap-4 p-4 bg-[#0A0A0A] border border-gray-900 rounded-xl">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#141414"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#39FF14" // Neon green brand accent
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={175.9}
              strokeDashoffset={175.9 - (175.9 * resolutionRate) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-white font-mono">{resolutionRate}%</span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Civic Resolution Speed</h3>
          <p className="text-[10px] text-gray-400 leading-normal mt-0.5 font-sans">
            Official municipal bodies are acting faster. Currently resolving {resolutionRate}% of all community-verified citizen reports.
          </p>
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="space-y-3" id="category-chart-section">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-brand" />
            OUTRAGE BY CATEGORY
          </h3>
          <span className="text-[8px] text-gray-500 font-mono">SECTOR METRICS</span>
        </div>

        <div className="space-y-2.5 p-3.5 bg-[#0A0A0A] border border-gray-900 rounded-xl">
          {(Object.entries(metrics.byCategory) as [Category, number][]).map(([cat, count]) => {
            const pct = metrics.totalIssues > 0 ? (count / metrics.totalIssues) * 100 : 0;
            const barColor = CATEGORY_COLORS[cat];
            const name = CATEGORY_NAMES[cat];
            const icon = CATEGORY_ICONS[cat];

            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-medium text-gray-300">
                    <span className="text-xs">{icon}</span>
                    {name}
                  </span>
                  <span className="font-mono text-gray-400 font-bold">{count} reports ({Math.round(pct)}%)</span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.max(3, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area-wise Heatmap list */}
      <div className="space-y-3" id="area-heatmap-section">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-brand" />
            WARD HEATMAPS & LOCALITIES
          </h3>
          <span className="text-[8px] text-gray-500 font-mono">BY WARD AREA</span>
        </div>

        {/* Search filter for wards */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nearby neighborhoods (e.g., West End)..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-[#0A0A0A] border border-gray-900 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-brand/50"
            id="ward-search-input"
          />
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {filteredAreas.length === 0 ? (
            <p className="text-[10px] text-gray-500 italic text-center py-4 font-sans">No data compiled for search query.</p>
          ) : (
            filteredAreas.map(([areaName, areaStats]) => {
              const areaTotal = areaStats.resolved + areaStats.unresolved;
              const areaResolvedPct = areaTotal > 0 ? (areaStats.resolved / areaTotal) * 100 : 0;

              return (
                <div key={areaName} className="p-2.5 bg-[#0A0A0A] border border-gray-900 rounded-lg flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white tracking-tight">{areaName}</span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {areaStats.resolved} Res • {areaStats.unresolved} Active
                    </span>
                  </div>

                  {/* Multi-segmented resolution heatmap bar */}
                  <div className="flex w-full h-2 bg-[#141414] rounded-full overflow-hidden">
                    {areaStats.resolved > 0 && (
                      <div
                        className="h-full bg-brand"
                        style={{ width: `${(areaStats.resolved / areaTotal) * 100}%` }}
                        title={`Resolved: ${areaStats.resolved}`}
                      />
                    )}
                    {areaStats.unresolved > 0 && (
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${(areaStats.unresolved / areaTotal) * 100}%` }}
                        title={`Active: ${areaStats.unresolved}`}
                      />
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[8px] text-gray-500 font-mono uppercase tracking-wide">
                    <span>MUNICIPAL CLEANUP INDEX</span>
                    <span className={areaResolvedPct >= 70 ? "text-brand font-bold" : areaResolvedPct >= 40 ? "text-yellow-500 font-bold" : "text-red-500 font-bold"}>
                      {Math.round(areaResolvedPct)}% RECOVERY
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="p-2.5 bg-[#0A0A0A] border border-gray-900 rounded-lg text-center text-[9px] text-gray-600 flex items-center gap-1.5 justify-center">
        <Flame className="w-3.5 h-3.5 text-brand animate-pulse" />
        <span>GroundZero dashboard refreshes automatically as local ward officers resolve issues.</span>
      </div>
    </div>
  );
}
