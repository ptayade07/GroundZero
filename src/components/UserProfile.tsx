import React, { useState } from "react";
import { User as UserType, Issue } from "../types";
import {
  LogOut,
  Award,
  ShieldCheck,
  Flame,
  FileText,
  ChevronRight,
  Eye,
  EyeOff,
  ThumbsUp,
  Users,
  TrendingUp,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

interface UserProfileProps {
  user: UserType;
  issues: Issue[];
  onLogout: () => void;
  onSelectIssue: (issue: Issue) => void;
  onUpdateUser: (updatedUser: UserType) => void;
}

export default function UserProfile({
  user,
  issues,
  onLogout,
  onUpdateUser,
  onSelectIssue
}: UserProfileProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Find all issues submitted by this user
  const userIssues = issues.filter(
    (issue) => issue.reporterId === user.id
  );

  // Calculate stats
  const totalPosts = userIssues.length;
  
  const totalReactions = userIssues.reduce((sum, issue) => {
    const r = issue.reactions || { verified: 0, cap: 0, big_issue: 0, bruh: 0 };
    return sum + (r.verified || 0) + (r.cap || 0) + (r.big_issue || 0) + (r.bruh || 0);
  }, 0);

  // Dynamic estimate of people reached
  const peopleReached = userIssues.reduce((sum, issue) => {
    const v = issue.reactions.verified || 0;
    const b = issue.reactions.big_issue || 0;
    return sum + 12 + (v * 18) + (b * 45);
  }, 0);

  // My Impact score = trust score * total posts
  const impactScore = user.trustScore * totalPosts;

  const getRank = (score: number) => {
    if (score >= 90) return { title: "Civic Sentinel", icon: "👑", color: "text-brand bg-brand/5 border-brand/20", desc: "Elite guardian of civic transparency." };
    if (score >= 75) return { title: "Ward Watcher", icon: "🛡️", color: "text-green-400 bg-green-950/40 border-green-500/30", desc: "Highly reliable community helper." };
    if (score >= 55) return { title: "Active Reporter", icon: "⚡", color: "text-blue-400 bg-blue-950/40 border-blue-500/30", desc: "Standard reporter reporting local outages." };
    return { title: "Civic Novice", icon: "🌱", color: "text-gray-400 bg-gray-900/40 border-gray-700/50", desc: "Newly initialized citizen on GroundZero." };
  };

  const rank = getRank(user.trustScore);

  // Civic badges checklist
  const badges = [
    {
      id: "first_report",
      title: "First Report",
      icon: "📍",
      description: "Filed your first report on the grid",
      earned: totalPosts >= 1
    },
    {
      id: "truth_seeker",
      title: "Truth Seeker",
      icon: "🔍",
      description: "Had at least one report verified by community",
      earned: userIssues.some(i => i.status === "Verified" || i.status === "Resolved" || i.status === "Escalated")
    },
    {
      id: "whistleblower",
      title: "Whistleblower",
      icon: "📣",
      description: "Reported Corruption or Govt Failure",
      earned: userIssues.some(i => ["Corruption", "Government Failure", "Harassment"].includes(i.category))
    },
    {
      id: "ground_reporter",
      title: "Ground Reporter",
      icon: "⚡",
      description: "Filed 3 or more incident reports",
      earned: totalPosts >= 3
    }
  ];

  // Call API to toggle anonymity
  const handleToggleAnonymous = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const nextAnon = !user.isAnonymous;
    try {
      const res = await fetch(`/api/users/${user.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnonymous: nextAnon })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onUpdateUser(data.user);
        }
      }
    } catch (e) {
      console.error("Failed to update user anonymity:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to extract initials
  const getInitials = (name: string) => {
    if (!name) return "GZ";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className="w-full max-w-lg mx-auto bg-[#0A0A0A]/95 border border-gray-900 rounded-xl p-4 md:p-6 text-white space-y-6 overflow-y-auto max-h-[85vh] scrollbar-none shadow-2xl"
      id="user-profile-view"
    >
      {/* Top Banner & Header info */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-900/60" id="profile-top-header">
        <div className="flex items-center gap-4">
          {/* Avatar with initials & glowing border */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 border-2 border-brand flex items-center justify-center text-brand text-lg font-black font-mono shadow-[0_0_15px_rgba(57,255,20,0.15)] shrink-0">
              {user.isAnonymous ? "🔒" : getInitials(user.name)}
            </div>
            {/* Status indicator */}
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand border-2 border-[#0A0A0A] flex items-center justify-center" title="Online Grid Operations">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black tracking-tight text-white uppercase leading-tight">
                {user.isAnonymous ? "Anonymous Citizen" : user.name}
              </h2>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border shrink-0 ${rank.color}`}>
                {rank.title}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono tracking-wide mt-0.5 uppercase">
              {user.isAnonymous ? "DECRYPTED OPERATIONS MASK" : user.email}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141414] hover:bg-red-950/30 hover:text-red-400 border border-gray-900 hover:border-red-500/20 text-[9px] font-bold uppercase rounded-lg transition-all text-gray-400 cursor-pointer"
          id="logout-btn"
        >
          <LogOut className="w-3 h-3" />
          <span>Exit</span>
        </button>
      </div>

      {/* Prominent Anonymous Mode Toggle */}
      <div className="p-3 bg-[#111] border border-gray-900 rounded-xl flex items-center justify-between" id="anon-mode-toggle-card">
        <div className="flex items-center gap-2.5">
          {user.isAnonymous ? (
            <div className="p-2 bg-brand/10 rounded-lg text-brand border border-brand/20">
              <EyeOff className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-2 bg-gray-900 rounded-lg text-gray-500 border border-gray-800">
              <Eye className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-gray-200 tracking-wider uppercase font-mono leading-none">
              ANONYMOUS SHIELD
            </p>
            <p className="text-[9px] text-gray-500 font-mono tracking-wide mt-0.5 uppercase">
              {user.isAnonymous ? "Your identity is encrypted" : "Your name is shown publicly"}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleAnonymous}
          disabled={isUpdating}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-black tracking-widest border transition-all cursor-pointer ${
            user.isAnonymous
              ? "bg-brand text-[#0A0A0A] border-brand shadow-[0_0_10px_rgba(57,255,20,0.25)]"
              : "bg-transparent text-gray-400 border-gray-800 hover:text-white"
          }`}
          id="toggle-anonymity-btn"
        >
          {user.isAnonymous ? "ACTIVE" : "DISABLED"}
        </button>
      </div>

      {/* Trust Score & Impact Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="trust-impact-metrics">
        {/* Trust score dial */}
        <div className="p-4 bg-[#111] border border-gray-900 rounded-xl flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#1c1c1c" strokeWidth="5" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#39FF14"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * user.trustScore) / 100}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-sm font-black text-white font-mono">{user.trustScore}</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 uppercase font-black tracking-wider">
              <Award className="w-3.5 h-3.5 text-brand" />
              Trust Score
            </div>
            <p className="text-[8px] text-gray-500 font-mono uppercase mt-0.5">
              Based on crowd verifications & resolutions.
            </p>
          </div>
        </div>

        {/* My Impact card */}
        <div className="p-4 bg-gradient-to-br from-[#111] to-[#141414] border border-gray-900 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-brand" />
              My Impact
            </div>
            <p className="text-xl font-black text-white tracking-tight leading-none mt-1">
              {impactScore}
            </p>
            <p className="text-[8.5px] text-gray-500 font-mono uppercase mt-0.5">
              Trust Score × Reports Filed
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3" id="profile-stats-row">
        {/* Total Posts */}
        <div className="p-3 bg-[#111]/60 border border-gray-900 rounded-xl text-center">
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">Posts</p>
          <div className="flex items-center justify-center gap-1.5 text-white">
            <FileText className="w-3.5 h-3.5 text-brand" />
            <span className="text-sm font-black font-mono leading-none">{totalPosts}</span>
          </div>
        </div>

        {/* Reactions Received */}
        <div className="p-3 bg-[#111]/60 border border-gray-900 rounded-xl text-center">
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">Reactions</p>
          <div className="flex items-center justify-center gap-1.5 text-white">
            <ThumbsUp className="w-3.5 h-3.5 text-brand" />
            <span className="text-sm font-black font-mono leading-none">{totalReactions}</span>
          </div>
        </div>

        {/* People Reached */}
        <div className="p-3 bg-[#111]/60 border border-gray-900 rounded-xl text-center">
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">Reached</p>
          <div className="flex items-center justify-center gap-1.5 text-white">
            <Users className="w-3.5 h-3.5 text-brand" />
            <span className="text-sm font-black font-mono leading-none">{peopleReached}</span>
          </div>
        </div>
      </div>

      {/* Civic Badges Row */}
      <div className="space-y-2.5" id="profile-civic-badges-row">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Earned Civic Badges
          </h3>
          <span className="text-[8px] text-gray-500 font-mono">GAMIFIED MILESTONES</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-2.5 border rounded-xl flex flex-col items-center text-center transition-all relative overflow-hidden ${
                badge.earned
                  ? "bg-[#111] border-brand/30 shadow-[0_0_10px_rgba(57,255,20,0.05)]"
                  : "bg-[#0A0A0A] border-gray-900/60 opacity-40 select-none"
              }`}
              title={badge.description}
            >
              {/* Badge Icon */}
              <span className={`text-xl mb-1 ${badge.earned ? "scale-100" : "grayscale filter"}`}>
                {badge.icon}
              </span>
              <p className={`text-[9px] font-black uppercase tracking-wider leading-tight ${badge.earned ? "text-brand" : "text-gray-500"}`}>
                {badge.title}
              </p>
              <p className="text-[7.5px] text-gray-500 font-mono leading-normal mt-0.5 line-clamp-2 uppercase">
                {badge.description}
              </p>

              {/* Verified badge status banner */}
              {badge.earned && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-brand rounded-bl-sm" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trust Score rules explanation / guide */}
      <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg text-[9px] text-gray-400 space-y-1 font-sans">
        <p className="font-bold text-brand flex items-center gap-1 text-[10px] uppercase font-mono">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          Trust Metric Operations
        </p>
        <ul className="list-disc pl-4 space-y-0.5 font-mono uppercase tracking-wide text-[8.5px]">
          <li>Community logs <span className="text-green-400">+5 TS</span> for every "Verified ✅" reaction.</li>
          <li>Submitting fake logs <span className="text-red-400">-12 TS</span> for "Cap 🧢" consensus.</li>
          <li>Official Status updates <span className="text-brand">up to +25 TS</span> when issue is Resolved!</li>
        </ul>
      </div>

      {/* My Stories (Personal Complaint list) */}
      <div className="space-y-3" id="reporter-history-section">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand" />
            My Stories ({userIssues.length})
          </h3>
          <span className="text-[8px] text-gray-500 font-mono">REPORT REGISTRY</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          {userIssues.length === 0 ? (
            <div className="p-6 bg-[#111] border border-gray-900 rounded-xl text-center text-gray-500 text-xs">
              <p>You haven't filed any grid reports yet.</p>
              <p className="text-[8px] text-gray-600 font-mono mt-1 uppercase">TAP 'REPORT ISSUE' IN FOOTER TO FILE AN INCIDENT</p>
            </div>
          ) : (
            userIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="p-3 bg-[#111] hover:bg-[#141414] border border-gray-900 hover:border-brand/20 rounded-xl flex items-center justify-between cursor-pointer transition-all gap-2"
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
                      {issue.category}
                    </span>
                    <span className="text-[8px] text-gray-600 font-mono">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight truncate">{issue.title}</h4>
                  <div className="flex items-center gap-2.5 text-[8.5px] text-gray-500 font-mono uppercase">
                    <span>{issue.area}</span>
                    <div className="flex items-center gap-1.5">
                      <span>✅ {issue.reactions.verified || 0}</span>
                      <span>🧢 {issue.reactions.cap || 0}</span>
                      <span>🔥 {issue.reactions.big_issue || 0}</span>
                      <span>💀 {issue.reactions.bruh || 0}</span>
                    </div>
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
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
