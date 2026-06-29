/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User as UserType, Issue } from "../types";
import { LogOut, Award, Flame, CheckCircle, AlertTriangle, HelpCircle, FileText, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface UserProfileProps {
  user: UserType;
  issues: Issue[];
  onLogout: () => void;
  onSelectIssue: (issue: Issue) => void;
}

export default function UserProfile({
  user,
  issues,
  onLogout,
  onSelectIssue
}: UserProfileProps) {
  // Find all issues submitted by this user
  const userIssues = issues.filter(
    (issue) => issue.reporterId === user.id
  );

  const getRank = (score: number) => {
    if (score >= 90) return { title: "Civic Sentinel", icon: "👑", color: "text-brand bg-brand/5 border-brand/20", nextScore: 100, desc: "Elite guardian of civic transparency and reporting." };
    if (score >= 75) return { title: "Ward Watcher", icon: "🛡️", color: "text-green-400 bg-green-950/40 border-green-500/30", nextScore: 90, desc: "Highly reliable community helper verifying local complaints." };
    if (score >= 55) return { title: "Active Reporter", icon: "⚡", color: "text-blue-400 bg-blue-950/40 border-blue-500/30", nextScore: 75, desc: "Standard reporter reporting local outages and potholes." };
    return { title: "Civic Novice", icon: "🌱", color: "text-gray-400 bg-gray-900/40 border-gray-700/50", nextScore: 55, desc: "Newly initialized citizen on GroundZero reporting grids." };
  };

  const rank = getRank(user.trustScore);

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0A0A0A]/95 border border-gray-900 rounded-xl p-4 md:p-6 text-white space-y-6 overflow-y-auto max-h-[85vh] scrollbar-none" id="user-profile-view">
      {/* Header Profile card */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand text-xl font-bold">
            {user.name.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight leading-none mb-1">
              {user.isAnonymous ? "Anonymous Citizen" : user.name}
            </h2>
            <p className="text-[10px] text-gray-500 font-mono tracking-wide">{user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-red-950/30 hover:text-red-400 border border-gray-800 hover:border-red-500/20 text-xs font-semibold rounded-lg transition-all text-gray-400 cursor-pointer"
          id="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Grid</span>
        </button>
      </div>

      {/* Trust Score circular metric */}
      <div className="p-4 bg-[#0A0A0A] border border-gray-900 rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-brand" />
            INDIVIDUAL TRUST SCORE
          </h3>
          <span className="text-[9px] text-brand font-bold font-mono">{user.trustScore}/100</span>
        </div>

        {/* Dynamic circular dial / bar */}
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#141414" strokeWidth="5.5" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#39FF14" // Neon green brand accent
                strokeWidth="5.5"
                fill="transparent"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * user.trustScore) / 100}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-sm font-black text-white font-mono">{user.trustScore}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">{rank.icon}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${rank.color}`}>
                {rank.title}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-snug">{rank.desc}</p>
          </div>
        </div>

        {/* Progress bar to next rank */}
        <div className="space-y-1 pt-1 border-t border-gray-900/40">
          <div className="flex justify-between text-[8px] text-gray-500 font-mono">
            <span>NEXT MILESTONE</span>
            <span>{user.trustScore} / {rank.nextScore} TS</span>
          </div>
          <div className="w-full h-1 bg-[#141414] rounded-full overflow-hidden">
            <div
              className="h-full bg-brand"
              style={{ width: `${(user.trustScore / rank.nextScore) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trust Score rules explanation */}
      <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg text-[10px] text-gray-400 space-y-1 font-sans">
        <p className="font-bold text-brand flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          How do I increase my trust score?
        </p>
        <ul className="list-disc pl-4 space-y-0.5 text-[9px] font-mono uppercase tracking-wide">
          <li>Community logs <span className="text-green-400">+5 TS</span> for every "Verified ✅" reaction.</li>
          <li>Submitting fake logs <span className="text-red-400">-12 TS</span> for "Fake 🧢" consensus.</li>
          <li>Official Status updates <span className="text-brand">up to +25 TS</span> when issue is Resolved!</li>
        </ul>
      </div>

      {/* Reporter's Post History */}
      <div className="space-y-3" id="reporter-history-section">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand" />
            MY COMPLAINT REGISTRY ({userIssues.length})
          </h3>
          <span className="text-[8px] text-gray-500 font-mono">FILED RADARS</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {userIssues.length === 0 ? (
            <div className="p-6 bg-[#0A0A0A] border border-gray-900 rounded-xl text-center text-gray-500 text-xs">
              <p>You haven't submitted any civic logs yet.</p>
              <p className="text-[9px] text-gray-600 font-mono mt-1 uppercase">TAP 'REPORT ISSUE' IN FOOTER TO START</p>
            </div>
          ) : (
            userIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="p-3 bg-[#0A0A0A] hover:bg-[#141414] border border-gray-900 hover:border-brand/20 rounded-lg flex items-center justify-between cursor-pointer transition-all gap-2"
                id={`history-item-${issue.id}`}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                      backgroundColor: {
                        "Civic Issue": "#818cf8",
                        "Pothole": "#f97316",
                        "Flooding": "#3b82f6",
                        "Power Cut": "#eab308",
                        "Garbage": "#a16207",
                        "Corruption": "#ef4444",
                        "Government Failure": "#b91c1c",
                        "Protest / Rally": "#ec4899",
                        "Local Drama": "#14b8a6",
                        "Argument / Dispute": "#f43f5e",
                        "Harassment": "#dc2626",
                        "Breaking News": "#06b6d4",
                        "Village Problem": "#22c55e",
                        "Weather": "#38bdf8",
                        "War / Conflict": "#4b5563",
                        "Other": "#6b7280"
                      }[issue.category] || "#6b7280"
                    }} />
                    <span className="text-[9px] text-gray-400 font-mono uppercase font-bold">
                      {{
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
                      }[issue.category] || "📍"} {issue.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight truncate">{issue.title}</h4>
                  <div className="flex items-center gap-1.5 text-[8px] text-gray-500 font-mono">
                    <span>{issue.area}</span>
                    <span>•</span>
                    <span>✅ {issue.reactions.verified}</span>
                    <span>🧢 {issue.reactions.cap || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold border ${
                    issue.status === "Resolved"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : issue.status === "Escalated"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : issue.status === "Verified"
                      ? "bg-brand/10 text-brand border-brand/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {issue.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
