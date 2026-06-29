/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Issue, Category, ReactionType } from "../types";
import { Search, Flame, MapPin, Sparkles, AlertTriangle, EyeOff, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

interface SocialFeedProps {
  issues: Issue[];
  currentUserId: string;
  onSelectIssue: (issue: Issue) => void;
  onReact: (issueId: string, reaction: ReactionType) => void;
}

const CATEGORY_MAP: Record<Category, { label: string; emoji: string; bg: string; text: string }> = {
  "Civic Issue": { label: "Civic Issue", emoji: "🏢", bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400" },
  "Pothole": { label: "Pothole", emoji: "🕳️", bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-400" },
  "Flooding": { label: "Flooding", emoji: "🌊", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
  "Power Cut": { label: "Power Cut", emoji: "🔌", bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-400" },
  "Garbage": { label: "Garbage", emoji: "🗑️", bg: "bg-amber-700/10 border-amber-700/30", text: "text-amber-500" },
  "Corruption": { label: "Corruption", emoji: "💼", bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
  "Government Failure": { label: "Govt Failure", emoji: "🏛️", bg: "bg-red-700/10 border-red-700/30", text: "text-red-500" },
  "Protest / Rally": { label: "Protest / Rally", emoji: "📣", bg: "bg-pink-500/10 border-pink-500/30", text: "text-pink-400" },
  "Local Drama": { label: "Local Drama", emoji: "🍵", bg: "bg-teal-500/10 border-teal-500/30", text: "text-teal-400" },
  "Argument / Dispute": { label: "Argument", emoji: "🗣️", bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400" },
  "Harassment": { label: "Harassment", emoji: "⚠️", bg: "bg-red-600/10 border-red-600/30", text: "text-red-500" },
  "Breaking News": { label: "Breaking News", emoji: "📰", bg: "bg-cyan-500/10 border-cyan-500/30", text: "text-cyan-400" },
  "Village Problem": { label: "Village Prob", emoji: "🏡", bg: "bg-green-500/10 border-green-500/30", text: "text-green-400" },
  "Weather": { label: "Weather", emoji: "☁️", bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-400" },
  "War / Conflict": { label: "Conflict", emoji: "💥", bg: "bg-gray-800/20 border-gray-700/30", text: "text-gray-400" },
  "Other": { label: "Other", emoji: "❓", bg: "bg-gray-700/10 border-gray-700/30", text: "text-gray-400" }
};

export default function SocialFeed({
  issues,
  currentUserId,
  onSelectIssue,
  onReact
}: SocialFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  const timeAgo = (dateStr: string) => {
    try {
      const created = new Date(dateStr).getTime();
      const now = Date.now();
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getRankBadge = (score: number) => {
    if (score >= 90) return "👑 Ground Zero Reporter";
    if (score >= 75) return "🛡️ Civic Sentinel";
    if (score >= 60) return "👾 Ward Watcher";
    if (score >= 45) return "⚡ Active Reporter";
    return "🌱 Civic Novice";
  };

  // Sort issues by newest first
  const sortedIssues = [...issues].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter issues based on search and category
  const filteredIssues = sortedIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.area.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-lg mx-auto text-white space-y-4" id="social-feed-view">
      {/* Title Header */}
      <div className="px-1">
        <h2 className="text-base font-black text-brand tracking-tight flex items-center gap-1.5 uppercase font-sans">
          <span>☕ Ground Zero Gossip & Reports</span>
        </h2>
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
          Worldwide real-time neighborhood bulletins, local drama, and civic tea.
        </p>
      </div>

      {/* Floating Filter & Search */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search neighborhood feeds..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0A0A0A] border border-gray-900 hover:border-brand/30 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-all font-sans"
            id="social-feed-search"
          />
        </div>

        {/* Category horizontal scrolling chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="feed-category-tabs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === "all"
                ? "bg-brand text-[#0A0A0A]"
                : "bg-[#0A0A0A] text-gray-400 hover:text-white border border-gray-900"
            }`}
          >
            🔥 All tea ({issues.length})
          </button>
          {(Object.keys(CATEGORY_MAP) as Category[]).map((cat) => {
            const config = CATEGORY_MAP[cat];
            const count = issues.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap border cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#141414] text-white border-brand"
                    : "bg-[#0A0A0A] text-gray-400 border-gray-900 hover:border-gray-800"
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Feed container */}
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 scrollbar-none" id="feed-cards-container">
        {filteredIssues.length === 0 ? (
          <div className="p-8 bg-[#0A0A0A] border border-gray-900 rounded-2xl text-center text-gray-500">
            <p className="text-xs">No reports or local tea found in this sector yet.</p>
            <p className="text-[9px] text-gray-600 font-mono mt-1 uppercase">TAP THE '+' BUTTON TO SPILL THE TEA FIRST!</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const catConfig = CATEGORY_MAP[issue.category] || CATEGORY_MAP["Other"];
            const userReaction = issue.userReactions?.[currentUserId];

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectIssue(issue)}
                className="bg-[#0A0A0A] border border-gray-900 hover:border-brand/20 rounded-2xl p-3.5 shadow-xl transition-all cursor-pointer relative flex flex-col gap-3 group"
                id={`feed-card-${issue.id}`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between text-[10px] pb-1 border-b border-gray-900/40">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs shrink-0">{issue.isAnonymous ? "👤" : "⚡"}</span>
                    <div className="min-w-0">
                      <p className="text-gray-200 font-bold truncate">
                        {issue.isAnonymous ? "Anonymous Citizen" : issue.reporterName}
                      </p>
                      <p className="text-[8px] text-gray-500 font-mono tracking-tight leading-none uppercase truncate">
                        {getRankBadge(issue.reporterTrustScore)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${catConfig.bg} ${catConfig.text}`}>
                      <span>{catConfig.emoji}</span> {catConfig.label}
                    </span>
                    <span className="text-gray-500 text-[8px]">{timeAgo(issue.createdAt)}</span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="flex gap-3 items-start min-w-0">
                  {/* Photo thumbnail */}
                  {issue.photoUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-900 bg-black/30">
                      <img
                        src={issue.photoUrl}
                        alt="Teaser"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-black text-white leading-tight group-hover:text-brand transition-colors">
                        {issue.title}
                      </h3>
                    </div>
                    {issue.isSpam && (
                      <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-red-950/40 border border-red-500/30 rounded text-red-400 text-[8.5px] font-mono uppercase font-semibold w-fit select-none">
                        <span>⚠️ AI flagged this as potentially misleading</span>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 leading-normal line-clamp-2 mt-1">
                      {issue.description}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-brand/80 font-mono mt-1.5">
                      <MapPin className="w-3 h-3 text-brand shrink-0" />
                      <span>{issue.area}</span>
                    </div>
                  </div>
                </div>

                {/* Gemini Vision AI summary teaser (if any) */}
                {issue.aiDescription && (
                  <div className="px-2.5 py-1 bg-brand/5 rounded-lg border border-brand/10 text-[9px] text-gray-500 italic font-mono flex items-center gap-1 line-clamp-1">
                    <Sparkles className="w-3 h-3 text-brand shrink-0 animate-pulse" />
                    <span className="truncate">"{issue.aiDescription}"</span>
                  </div>
                )}

                {/* Reaction footer counts bar */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-900/40">
                  <div className="flex items-center gap-1 font-mono text-[9px] text-gray-500 uppercase">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>TAP CARD FOR POST DETAILS</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Verified ✅ count */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(issue.id, "verified");
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition-all cursor-pointer ${
                        userReaction === "verified"
                          ? "bg-green-600/20 text-green-400 border-green-500"
                          : "bg-[#141414] text-gray-400 border-gray-900 hover:border-gray-800"
                      }`}
                    >
                      <span>✅</span>
                      <span className="text-[9px] font-mono">{issue.reactions.verified || 0}</span>
                    </button>

                    {/* Cap 🧢 count */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(issue.id, "cap");
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition-all cursor-pointer ${
                        userReaction === "cap"
                          ? "bg-red-600/20 text-red-400 border-red-500"
                          : "bg-[#141414] text-gray-400 border-gray-900 hover:border-gray-800"
                      }`}
                    >
                      <span>🧢</span>
                      <span className="text-[9px] font-mono">{issue.reactions.cap || 0}</span>
                    </button>

                    {/* Big Issue 🔥 count */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(issue.id, "big_issue");
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition-all cursor-pointer ${
                        userReaction === "big_issue"
                          ? "bg-brand/20 text-brand border-brand"
                          : "bg-[#141414] text-gray-400 border-gray-900 hover:border-gray-800"
                      }`}
                    >
                      <span>🔥</span>
                      <span className="text-[9px] font-mono">{issue.reactions.big_issue || 0}</span>
                    </button>

                    {/* Bruh 💀 count */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(issue.id, "bruh");
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition-all cursor-pointer ${
                        userReaction === "bruh"
                          ? "bg-teal-600/20 text-teal-400 border-teal-500"
                          : "bg-[#141414] text-gray-400 border-gray-900 hover:border-gray-800"
                      }`}
                    >
                      <span>💀</span>
                      <span className="text-[9px] font-mono">{issue.reactions.bruh || 0}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
