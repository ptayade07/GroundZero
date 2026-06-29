/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Issue, Status, Category, ReactionType } from "../types";
import { X, Calendar, MapPin, User, ShieldCheck, AlertCircle, Sparkles, CheckCircle, ShieldAlert, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface IssuePopupProps {
  issue: Issue;
  allIssues?: Issue[];
  currentUserId: string;
  onClose: () => void;
  onReact: (issueId: string, reaction: ReactionType) => void;
  onUpdateStatus?: (issueId: string, newStatus: Status) => void;
  onAddPerspective?: (parentIssueId: string) => void;
  onSelectPerspective?: (issue: Issue) => void;
}

const CATEGORY_STYLES: Record<Category, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  "Civic Issue": { label: "Civic Issue", emoji: "🏢", bg: "bg-indigo-950/50", text: "text-indigo-400", border: "border-indigo-500/30" },
  "Pothole": { label: "Pothole Crater", emoji: "🕳️", bg: "bg-orange-950/50", text: "text-orange-400", border: "border-orange-500/30" },
  "Flooding": { label: "Flooding", emoji: "🌊", bg: "bg-blue-950/50", text: "text-blue-400", border: "border-blue-500/30" },
  "Power Cut": { label: "Power Blackout", emoji: "🔌", bg: "bg-yellow-950/50", text: "text-yellow-400", border: "border-yellow-500/30" },
  "Garbage": { label: "Garbage Pile", emoji: "🗑️", bg: "bg-amber-950/50", text: "text-amber-500", border: "border-amber-700/30" },
  "Corruption": { label: "Corruption", emoji: "💼", bg: "bg-red-950/50", text: "text-red-400", border: "border-red-500/30" },
  "Government Failure": { label: "Government Failure", emoji: "🏛️", bg: "bg-red-950/60", text: "text-red-500", border: "border-red-700/30" },
  "Protest / Rally": { label: "Protest / Rally", emoji: "📣", bg: "bg-pink-950/50", text: "text-pink-400", border: "border-pink-500/30" },
  "Local Drama": { label: "Local Drama", emoji: "🍵", bg: "bg-teal-950/50", text: "text-teal-400", border: "border-teal-500/30" },
  "Argument / Dispute": { label: "Argument / Dispute", emoji: "🗣️", bg: "bg-rose-950/50", text: "text-rose-400", border: "border-rose-500/30" },
  "Harassment": { label: "Harassment", emoji: "⚠️", bg: "bg-red-950/50", text: "text-red-500", border: "border-red-600/30" },
  "Breaking News": { label: "Breaking News", emoji: "📰", bg: "bg-cyan-950/50", text: "text-cyan-400", border: "border-cyan-500/30" },
  "Village Problem": { label: "Village Problem", emoji: "🏡", bg: "bg-green-950/50", text: "text-green-400", border: "border-green-500/30" },
  "Weather": { label: "Weather Conditions", emoji: "☁️", bg: "bg-sky-950/50", text: "text-sky-400", border: "border-sky-500/30" },
  "War / Conflict": { label: "War / Conflict", emoji: "💥", bg: "bg-gray-950/80", text: "text-gray-300", border: "border-gray-700/30" },
  "Other": { label: "Other", emoji: "❓", bg: "bg-gray-900/50", text: "text-gray-400", border: "border-gray-500/30" }
};

const STATUS_DETAILS: Record<Status, { label: string; colorClass: string; icon: any; desc: string }> = {
  Reported: { label: "Reported", colorClass: "bg-blue-500/20 text-blue-400 border-blue-500/40", icon: AlertCircle, desc: "Broadcast logged. Pending community validation checks." },
  Verified: { label: "Verified", colorClass: "bg-green-500/20 text-green-400 border-green-500/40", icon: CheckCircle, desc: "Community consensus confirms this is real. No Cap!" },
  Escalated: { label: "Escalated", colorClass: "bg-red-500/20 text-red-400 border-red-500/40", icon: ShieldAlert, desc: "Sent to Ward Representatives for official civic intervention." },
  Resolved: { label: "Resolved", colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: ShieldCheck, desc: "Civic issue successfully resolved. immaculate vibes restored!" }
};

export default function IssuePopup({
  issue,
  allIssues = [],
  currentUserId,
  onClose,
  onReact,
  onUpdateStatus,
  onAddPerspective,
  onSelectPerspective
}: IssuePopupProps) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Compute media and parent-perspective linkings
  const mediaUrls = issue.mediaUrls || (issue.photoUrl ? [issue.photoUrl] : []);
  const activeMediaUrl = mediaUrls[activeMediaIndex] || "";
  const isVideo = issue.mediaType === "video" || activeMediaUrl.startsWith("data:video/");

  const parentId = issue.parentIssueId || issue.id;
  // Sibling perspectives include the parent and any children who link to this parent
  const siblingPerspectives = allIssues.filter(
    i => i.id === parentId || i.parentIssueId === parentId
  );
  const reporterCount = siblingPerspectives.length || 1;

  const getTrustBadge = (score: number) => {
    if (score >= 90) return { label: "Ground Zero Reporter", color: "text-brand border-brand/50 bg-brand/10" };
    if (score >= 75) return { label: "Civic Sentinel", color: "text-brand/90 border-brand/40 bg-brand/10" };
    if (score >= 60) return { label: "Ward Watcher", color: "text-purple-400 border-purple-500/30 bg-purple-950/30" };
    if (score >= 45) return { label: "Active Reporter", color: "text-blue-400 border-blue-500/30 bg-blue-950/30" };
    return { label: "Civic Novice", color: "text-gray-400 border-gray-700 bg-gray-900/40" };
  };

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

  const catStyle = CATEGORY_STYLES[issue.category] || CATEGORY_STYLES["Other"];
  const statusInfo = STATUS_DETAILS[issue.status] || STATUS_DETAILS.Reported;
  const StatusIcon = statusInfo.icon;
  const badge = getTrustBadge(issue.reporterTrustScore);

  // Check current user reactions
  const userReaction = issue.userReactions?.[currentUserId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="absolute bottom-20 left-4 right-4 z-40 bg-[#0A0A0A]/95 border border-brand/40 rounded-2xl shadow-2xl shadow-brand/10 p-4 backdrop-blur-md max-w-md mx-auto max-h-[75vh] overflow-y-auto"
      id={`issue-popup-${issue.id}`}
    >
      {/* Spam detection alert ribbon */}
      {issue.isSpam && (
        <div className="mb-3 px-3 py-1.5 bg-red-950/50 border border-red-500/40 rounded-lg text-[10px] text-red-400 flex items-center gap-1.5 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500 animate-pulse" />
          <span>⚠️ AI SPAM WARNING: Flagged as suspicious / gibberish ({issue.spamReasoning})</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              <span>{catStyle.emoji}</span>
              <span>{catStyle.label}</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono">REACH: {issue.reporterTrustScore >= 70 ? "🔥 HIGH" : "⚡ NORMAL"}</span>
          </div>
          <h3 className="text-sm font-black text-white tracking-tight mt-1.5">{issue.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand" />
              {issue.area}
            </span>
            <span>•</span>
            <span>{timeAgo(issue.createdAt)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-[#141414] text-gray-400 hover:text-white transition-all shrink-0 cursor-pointer"
          id="close-popup-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Photo / Video Gallery and Description */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        {activeMediaUrl && (
          <div className="w-full h-44 rounded-xl overflow-hidden border border-gray-900 bg-black/40 relative">
            {isVideo ? (
              <video
                src={activeMediaUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt={issue.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            
            {/* AI verification seal badge if high confidence */}
            {issue.status !== "Reported" && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-brand text-[#0A0A0A] rounded-full text-[8px] font-black uppercase shadow-lg z-10">
                <Sparkles className="w-2.5 h-2.5" />
                VERIFIED SOURCE
              </div>
            )}
          </div>
        )}

        {/* Thumbnail row if multiple files exist */}
        {mediaUrls.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-thin">
            {mediaUrls.map((url, idx) => {
              const isUrlVideo = issue.mediaType === "video" || url.startsWith("data:video/");
              return (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-12 h-12 rounded-lg border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                    activeMediaIndex === idx ? "border-brand" : "border-gray-800 opacity-65 hover:opacity-100"
                  }`}
                >
                  {isUrlVideo ? (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center text-xs">📹</div>
                  ) : (
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-300 leading-relaxed font-sans font-normal mt-1">
          {issue.description}
        </p>
      </div>

      {/* Grouped Perspectives Block */}
      <div className="mb-3 p-3 bg-zinc-950/80 border border-gray-900 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-brand uppercase tracking-wider font-mono">
            📢 {reporterCount} {reporterCount === 1 ? 'person reported this' : 'people reported this'}
          </span>
        </div>
        
        {siblingPerspectives.length > 1 && (
          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider font-mono">Select a perspective to view:</p>
            {siblingPerspectives.map((sib) => (
              <button
                key={sib.id}
                onClick={() => onSelectPerspective?.(sib)}
                className={`w-full p-2 rounded-lg border text-left transition-all flex flex-col cursor-pointer ${
                  sib.id === issue.id
                    ? "bg-brand/10 border-brand/35 text-white"
                    : "bg-[#0A0A0A] border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                }`}
              >
                <div className="flex justify-between items-center text-[9px] w-full font-semibold gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate">
                      {sib.isAnonymous 
                        ? (sib.reporterName.startsWith("Anonymous Citizen") && sib.reporterName.includes("#") 
                            ? sib.reporterName 
                            : `Anonymous Citizen #` + (Math.abs(sib.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 9000 + 1000))
                        : sib.reporterName}
                    </span>
                    <span className="text-[7.5px] px-1 bg-black border border-brand/20 text-brand font-mono rounded font-black tracking-tight shrink-0">
                      🛡️ {sib.reporterTrustScore}
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono font-normal shrink-0">{timeAgo(sib.createdAt)}</span>
                </div>
                <p className="text-[10px] line-clamp-1 leading-snug mt-0.5">
                  {sib.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gemini Vision AI analysis explanation box */}
      {issue.aiDescription && (
        <div className="mb-3 p-2.5 bg-gradient-to-r from-brand/5 to-brand/10 border border-brand/20 rounded-xl">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
            <span className="text-[9px] font-black tracking-wider text-brand uppercase font-mono">GEMINI CO-PILOT radar</span>
          </div>
          <p className="text-[10px] text-gray-400 italic leading-snug font-mono">
            "{issue.aiDescription}"
          </p>
        </div>
      )}

      {/* Progress & Verification info */}
      <div className="flex flex-col gap-2 p-2.5 bg-[#0A0A0A]/90 border border-gray-900 rounded-xl mb-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">GRID STATUS</span>
          <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 ${statusInfo.colorClass}`}>
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </div>
        </div>

        {/* Status timeline text */}
        <p className="text-[9px] text-gray-400 font-sans leading-snug">
          {statusInfo.desc}
        </p>

        {/* Status progress tracker */}
        <div className="flex items-center justify-between gap-1 pt-1.5">
          {["Reported", "Verified", "Escalated", "Resolved"].map((step, idx) => {
            const steps = ["Reported", "Verified", "Escalated", "Resolved"];
            const currentIdx = steps.indexOf(issue.status);
            const isActive = idx <= currentIdx;
            const isLatest = idx === currentIdx;

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${
                    isLatest
                      ? "bg-brand text-[#0A0A0A] animate-pulse"
                      : isActive
                      ? "bg-brand/20 text-brand border border-brand/30"
                      : "bg-[#0A0A0A] text-gray-600 border border-gray-800"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[7px] mt-1 font-mono uppercase tracking-wide ${
                    isActive ? "text-brand" : "text-gray-600"
                  }`}>
                    {step}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`h-[1px] flex-1 -mt-3.5 ${
                    idx < currentIdx ? "bg-brand" : "bg-gray-800"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Submitter Details */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-900 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#141414] to-[#0A0A0A] flex items-center justify-center text-brand border border-gray-800 text-[10px] font-black">
            {issue.isAnonymous ? "👤" : "⚡"}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-gray-200 font-bold font-sans">
                {issue.isAnonymous 
                  ? (issue.reporterName.startsWith("Anonymous Citizen") && issue.reporterName.includes("#") 
                      ? issue.reporterName 
                      : `Anonymous Citizen #` + (Math.abs(issue.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 9000 + 1000))
                  : issue.reporterName}
              </p>
              <span className="text-[8px] px-1 bg-[#141414] border border-brand/20 text-brand font-mono rounded font-black tracking-tight shrink-0">
                🛡️ {issue.reporterTrustScore}
              </span>
            </div>
            <p className="text-gray-500 font-mono text-[8px] uppercase">OPERATIVE</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <span className={`px-1.5 py-0.2 rounded text-[7px] font-bold border uppercase tracking-wide ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase">TRUST: <span className="text-brand font-bold">{issue.reporterTrustScore}</span></p>
        </div>
      </div>

      {/* Reactions Panel */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] text-gray-500 font-mono uppercase">VIBE CHECK VOUCH</span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Reaction 1: Verified (✅) */}
          <button
            onClick={() => onReact(issue.id, "verified")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
              userReaction === "verified"
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-sm shadow-emerald-500/10"
                : "bg-[#141414] text-gray-300 border-gray-800/80 hover:border-gray-700"
            }`}
            id={`reaction-verified-${issue.id}`}
            title="Real Report"
          >
            <span>✅ Verified</span>
            <span className="font-mono text-[9px] bg-black/30 px-1 rounded">{issue.reactions.verified || 0}</span>
          </button>

          {/* Reaction 2: Cap (🧢) */}
          <button
            onClick={() => onReact(issue.id, "cap")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
              userReaction === "cap"
                ? "bg-red-600/20 text-red-400 border-red-500 shadow-sm shadow-red-500/10"
                : "bg-[#141414] text-gray-300 border-gray-800/80 hover:border-gray-700"
            }`}
            id={`reaction-cap-${issue.id}`}
            title="Fake / Cap Report"
          >
            <span>🧢 Cap</span>
            <span className="font-mono text-[9px] bg-black/30 px-1 rounded">{issue.reactions.cap || 0}</span>
          </button>

          {/* Reaction 3: Big Issue (🔥) */}
          <button
            onClick={() => onReact(issue.id, "big_issue")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
              userReaction === "big_issue"
                ? "bg-brand/20 text-brand border border-brand shadow-sm shadow-brand/10"
                : "bg-[#141414] text-gray-300 border-gray-800/80 hover:border-gray-700"
            }`}
            id={`reaction-bigissue-${issue.id}`}
            title="Needs Attention ASAP"
          >
            <span>🔥 Big Issue</span>
            <span className="font-mono text-[9px] bg-black/30 px-1 rounded">{issue.reactions.big_issue || 0}</span>
          </button>

          {/* Reaction 4: Bruh (💀) */}
          <button
            onClick={() => onReact(issue.id, "bruh")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
              userReaction === "bruh"
                ? "bg-teal-600/20 text-teal-400 border-teal-500 shadow-sm shadow-teal-500/10"
                : "bg-[#141414] text-gray-300 border-gray-800/80 hover:border-gray-700"
            }`}
            id={`reaction-bruh-${issue.id}`}
            title="Wow / Bruh moment"
          >
            <span>💀 Bruh</span>
            <span className="font-mono text-[9px] bg-black/30 px-1 rounded">{issue.reactions.bruh || 0}</span>
          </button>
        </div>
      </div>

      {/* Add Another Angle Button */}
      {onAddPerspective && (
        <button
          onClick={() => onAddPerspective(parentId)}
          className="w-full mt-3 py-2 bg-gradient-to-r from-brand to-brand/85 hover:from-brand/90 hover:to-brand/75 text-[#0A0A0A] font-black uppercase text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          id="add-angle-btn"
        >
          <span>📸 Add Another Angle / Perspective</span>
        </button>
      )}


    </motion.div>
  );
}
