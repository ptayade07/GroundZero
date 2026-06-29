/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Issue, DashboardMetrics, Category, Status, ReactionType } from "./types";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import MapComponent from "./components/MapComponent";
import IssuePopup from "./components/IssuePopup";
import ReportForm from "./components/ReportForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import UserProfile from "./components/UserProfile";
import SocialFeed from "./components/SocialFeed";
import { Map, Plus, BarChart3, User as UserIcon, ShieldAlert, Navigation, Layers, AlertCircle, Sparkles, Check, ChevronDown, ListFilter, SlidersHorizontal, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // State managers
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<"map" | "feed" | "report" | "profile">("map");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  
  // Profile sub-tab selector: "profile" (My Registry) vs "dashboard" (City Outrage)
  const [profileSubTab, setProfileSubTab] = useState<"registry" | "dashboard">("registry");

  // Filter and Search for Map/Feed list
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [timeFilter, setTimeFilter] = useState<"2hrs" | "today" | "week" | "all">("today");
  const [showFeedDrawer, setShowFeedDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Report Form placement states
  const [isSelectingLocationMode, setIsSelectingLocationMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; area: string } | null>(null);
  const [preLinkedParentIssue, setPreLinkedParentIssue] = useState<Issue | null>(null);

  const handleAddPerspective = (parentId: string) => {
    const parentIssue = issues.find(i => i.id === parentId);
    if (parentIssue) {
      setPreLinkedParentIssue(parentIssue);
      setSelectedLocation({
        lat: parentIssue.lat,
        lng: parentIssue.lng,
        area: parentIssue.area
      });
      setSelectedIssue(null);
      setView("report");
      triggerToast(`Adding perspective linked to: "${parentIssue.title}"`);
    }
  };

  // Global loading and error message banners
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Auto-clear toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Fetch all issues from backend
  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    }
  };

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (res.ok) {
        const data = await res.json();
        setDashboardMetrics(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
    }
  };

  // Refresh User Trust Score from database
  const refreshUserTrustScore = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, trustScore: data.trustScore } : null);
      }
    } catch (err) {
      console.error("Error refreshing trust score:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchIssues();
    fetchMetrics();

    // Recover login from localStorage if exists
    const storedUser = localStorage.getItem("gz_citizen");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setShowLanding(false);
        refreshUserTrustScore(parsed.id);
      } catch (e) {
        localStorage.removeItem("gz_citizen");
      }
    }
  }, []);

  // Sync metrics whenever issues refresh
  useEffect(() => {
    fetchMetrics();
    if (user) {
      refreshUserTrustScore(user.id);
    }
  }, [issues]);

  // Auth logins
  const handleLogin = async (email: string, name: string, isAnonymous: boolean) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, isAnonymous })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login Failed");
      }

      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("gz_citizen", JSON.stringify(data.user));
        triggerToast(`Welcome to GroundZero Grid, ${data.user.name}!`);
        setView("map");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Connection refused to GroundZero central server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowLanding(true);
    localStorage.removeItem("gz_citizen");
    triggerToast("Logged out of GroundZero operations grid.");
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem("gz_citizen", JSON.stringify(updatedUser));
    triggerToast(`Anonymity shield ${updatedUser.isAnonymous ? "activated" : "deactivated"}.`);
  };

  // Submitting a new issue report
  const handleReportSubmit = async (reportData: {
    description: string;
    category: Category | "";
    photoUrl: string;
    mediaUrls?: string[];
    mediaType?: 'photo' | 'video';
    parentIssueId?: string;
    lat: number;
    lng: number;
    isAnonymous: boolean;
    useAI: boolean;
  }) => {
    if (!user) return;

    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...reportData,
        reporterId: user.id,
        useAI: reportData.useAI
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to log report.");
    }

    const data = await res.json();
    if (data.success) {
      // Re-fetch list
      await fetchIssues();
      
      // Reset creation states
      setSelectedLocation(null);
      setIsSelectingLocationMode(false);
      setPreLinkedParentIssue(null);
      setView("map");

      // Highlight newest report on map instantly
      setSelectedIssue(data.issue);

      if (data.aiAnalysis) {
        triggerToast(`Gemini AI detected Category: ${data.issue.category.toUpperCase()}`);
      } else {
        triggerToast("Civic report broadcasted onto the live radar map.");
      }
    }
  };

  // Community reacting to reports
  const handleReactToIssue = async (issueId: string, reactionType: ReactionType) => {
    if (!user) {
      triggerToast("Please authenticate to reaction-vouch reports.");
      return;
    }

    try {
      const res = await fetch(`/api/issues/${issueId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, reactionType })
      });

      if (res.ok) {
        const data = await res.json();
        // Update issues local state array
        setIssues(prev => prev.map(issue => issue.id === issueId ? data.issue : issue));
        
        // Update selected issue popup detail in place
        if (selectedIssue?.id === issueId) {
          setSelectedIssue(data.issue);
        }

        // Trigger dynamic reporter trust score recalculation updates
        await refreshUserTrustScore(user.id);

        triggerToast("Vouch reaction broadcasted. Trust Scores synchronized!");
      }
    } catch (err) {
      console.error("Error submitting reaction:", err);
    }
  };

  // Status updating (Sandboxed Admin Demonstration)
  const handleUpdateStatus = async (issueId: string, newStatus: Status) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        setIssues(prev => prev.map(issue => issue.id === issueId ? data.issue : issue));
        if (selectedIssue?.id === issueId) {
          setSelectedIssue(data.issue);
        }
        triggerToast(`Municipal status updated to: ${newStatus}`);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Handle location selected from map clicking
  const handleSelectLocationForNewIssue = (lat: number, lng: number, area: string) => {
    setSelectedLocation({ lat, lng, area });
    setIsSelectingLocationMode(false);
    setView("report"); // Switch back to report form screen
    triggerToast(`Location pin placed at ${area} successfully.`);
  };

  const handleEnterLocationSelectionMode = () => {
    setIsSelectingLocationMode(true);
    setView("map"); // Swaps to map so they can tap on it
    setSelectedIssue(null); // Clear active popups
    triggerToast("Tap anywhere on the map to place complaint pin");
  };

  // Filter issues based on UI selections
  const filteredIssues = issues.filter(issue => {
    const categoryMatches = categoryFilter === "all" || issue.category === categoryFilter;
    const statusMatches = statusFilter === "all" || issue.status === statusFilter;
    const searchMatches = searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.area.toLowerCase().includes(searchQuery.toLowerCase());

    // Time filter matching
    let timeMatches = true;
    if (timeFilter !== "all") {
      const createdTime = new Date(issue.createdAt).getTime();
      const now = Date.now();
      const diffMs = now - createdTime;

      if (timeFilter === "2hrs") {
        timeMatches = diffMs <= 2 * 60 * 60 * 1000;
      } else if (timeFilter === "today") {
        timeMatches = diffMs <= 24 * 60 * 60 * 1000;
      } else if (timeFilter === "week") {
        timeMatches = diffMs <= 7 * 24 * 60 * 60 * 1000;
      }
    }

    return categoryMatches && statusMatches && searchMatches && timeMatches;
  });

  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          onLoginClick={() => setShowLanding(false)}
          onSignUpClick={() => setShowLanding(false)}
          onContinueAnonymously={() => handleLogin("", "", true)}
        />
      );
    } else {
      return (
        <div className="w-full h-screen flex flex-col bg-[#0A0A0A] text-white relative overflow-y-auto" id="login-container-wrapper">
          {/* Top Back navigation */}
          <div className="absolute top-6 left-6 z-50">
            <button
              onClick={() => setShowLanding(true)}
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-gray-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-gray-900 shadow-xl"
              id="back-to-landing-btn"
            >
              ← Back
            </button>
          </div>
          <div className="w-full min-h-screen flex items-center justify-center py-16">
            <LoginPage onLogin={handleLogin} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-[#0A0A0A] select-none text-white relative font-sans overflow-hidden" id="groundzero-root">
      
      {/* Top operational banner header */}
      <header className="px-4 py-3 bg-[#0A0A0A]/95 border-b border-gray-900 flex items-center justify-between backdrop-blur shrink-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-gradient-to-tr from-[#124d04] to-brand rounded text-xs font-black font-mono shadow-md shadow-brand/20 text-[#0A0A0A]">
            GZ
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight uppercase leading-none text-white">
                GROUND<span className="text-brand">ZERO</span>
              </h1>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-[#39FF14]/30 text-[#39FF14] text-[8px] font-black tracking-wider uppercase">
                <span className="w-1 h-1 rounded-full bg-[#39FF14] animate-ping" />
                <span className="animate-pulse">LIVE</span>
              </span>
            </div>
            <p className="text-[8px] text-gray-500 font-mono leading-none tracking-widest uppercase mt-0.5">
              LIVE HYPERLOCAL CITIZEN GRID
            </p>
          </div>
        </div>

        {/* Live radar indicators and trust score */}
        <div className="flex items-center gap-2">
          {user ? (
            <div
              onClick={() => setView("profile")}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0A0A0A] border border-gray-800 rounded-lg text-xs cursor-pointer hover:border-brand/40 transition-all font-mono"
              id="top-profile-badge"
            >
              <span className="text-brand text-[10px] animate-pulse">●</span>
              <span className="text-gray-400 font-sans font-medium line-clamp-1 max-w-[80px] text-[10px]">
                {user.isAnonymous ? "Anonymous" : user.name.split(" ")[0]}
              </span>
              <span className="px-1 py-0.2 bg-brand/10 text-brand rounded text-[8px] font-bold">
                {user.trustScore} TS
              </span>
            </div>
          ) : (
            <div className="text-[9px] text-gray-500 font-mono tracking-wider flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              OFFLINE GRIDS
            </div>
          )}
        </div>
      </header>

      {/* Main operational panel */}
      <main className="flex-1 relative overflow-hidden" id="main-grid-panel">
        {/* Main Views */}
        <div className="w-full h-full relative">
          
          {/* View 1: Feed & Map (Google Maps Engine) */}
          <div className={`w-full h-full absolute inset-0 ${view === "map" ? "block" : "hidden"}`}>
            {/* Filter Floating controls on Map */}
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 max-w-xs right-20">
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search radar reports..."
                  className="w-full pl-3 pr-8 py-2 text-xs bg-[#0A0A0A]/95 border border-gray-800 hover:border-brand/40 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-brand shadow-lg backdrop-blur"
                  id="radar-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-gray-500 hover:text-white text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Time filter row below search bar */}
              <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none" id="radar-time-filters">
                {(["2hrs", "today", "week", "all"] as const).map((opt) => {
                  const label = {
                    "2hrs": "Last 2hrs",
                    "today": "Today",
                    "week": "This Week",
                    "all": "All Time"
                  }[opt];
                  return (
                    <button
                      key={opt}
                      onClick={() => setTimeFilter(opt)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider font-bold shrink-0 transition-all cursor-pointer border ${
                        timeFilter === opt
                          ? "bg-[#39FF14] text-[#0A0A0A] border-[#39FF14] shadow-[0_0_6px_rgba(57,255,20,0.3)]"
                          : "bg-[#0A0A0A]/95 text-gray-500 border-gray-800/80 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Filters Collapse Row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="radar-filters-row">
                {/* Category Filter selector */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="px-2 py-1 bg-[#0A0A0A]/95 border border-gray-800 rounded-md text-[10px] text-gray-300 font-mono outline-none shadow focus:border-brand/50"
                >
                  <option value="all">ALL SECTORS</option>
                  <option value="flood">🌊 FLOODS</option>
                  <option value="pothole">🕳️ POTHOLES</option>
                  <option value="crime">🚨 SECURITY</option>
                  <option value="power cut">🔌 POWER CUTS</option>
                  <option value="garbage">🗑️ GARBAGE</option>
                  <option value="protest">📣 PROTESTS</option>
                  <option value="event">🕺 EVENTS</option>
                  <option value="drama">🍵 LOCAL DRAMA</option>
                </select>

                {/* Status Filter selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2 py-1 bg-[#0A0A0A]/95 border border-gray-800 rounded-md text-[10px] text-gray-300 font-mono outline-none shadow focus:border-brand/50"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="Reported">REPORTED</option>
                  <option value="Verified">VERIFIED</option>
                  <option value="Escalated">ESCALATED</option>
                  <option value="Resolved">RESOLVED</option>
                </select>

                {/* Toggle Drawer button */}
                <button
                  onClick={() => setShowFeedDrawer(!showFeedDrawer)}
                  className={`px-2 py-1 bg-[#0A0A0A]/95 border rounded-md text-[10px] font-mono flex items-center gap-1 shrink-0 ${
                    showFeedDrawer ? "border-brand text-brand" : "border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <span>FEED LIST ({filteredIssues.length})</span>
                </button>
              </div>
            </div>

            {/* Collapsible Feed Drawer (Bottom/Side slide overlay list) */}
            <AnimatePresence>
              {showFeedDrawer && (
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  className="absolute top-18 bottom-4 left-4 z-30 w-72 bg-[#0A0A0A]/95 border border-gray-800 rounded-xl shadow-2xl p-3 flex flex-col backdrop-blur max-h-[72vh] md:max-h-[80vh]"
                  id="feed-list-drawer"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">CIVIC COMPLAINT FEED</span>
                    <button
                      onClick={() => setShowFeedDrawer(false)}
                      className="text-xs text-gray-500 hover:text-brand font-bold"
                    >
                      CLOSE
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                    {filteredIssues.length === 0 ? (
                      <p className="text-xs text-gray-600 italic text-center py-8">No issues logged on selected filters.</p>
                    ) : (
                      filteredIssues.map(issue => (
                        <div
                          key={issue.id}
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowFeedDrawer(false); // Close feed to show map pin zoom
                          }}
                          className={`p-2 bg-[#0A0A0A] hover:bg-[#141414] border rounded-lg cursor-pointer transition-all flex flex-col gap-1 ${
                            selectedIssue?.id === issue.id ? "border-brand bg-[#141414]" : "border-gray-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                              issue.category === "flood" ? "bg-blue-950/40 text-blue-400" :
                              issue.category === "pothole" ? "bg-brand/15 text-brand" :
                              issue.category === "crime" ? "bg-red-950/40 text-red-400" :
                              issue.category === "power cut" ? "bg-yellow-950/40 text-yellow-400" :
                              issue.category === "protest" ? "bg-purple-950/40 text-purple-400" :
                              issue.category === "event" ? "bg-pink-950/40 text-pink-400" :
                              issue.category === "drama" ? "bg-teal-950/40 text-teal-400" :
                              "bg-amber-950/40 text-amber-500"
                            }`}>
                              {issue.category}
                            </span>
                            <span className="text-[8px] font-mono text-gray-500">{issue.area}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">{issue.title}</h4>
                          <p className="text-[10px] text-gray-400 line-clamp-1 leading-snug">{issue.description}</p>
                          <div className="flex items-center justify-between text-[8px] text-gray-500 font-mono mt-0.5">
                            <span>✅ {issue.reactions.verified} vouches</span>
                            <span className="uppercase font-bold text-brand">{issue.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Maps Canvas Layer */}
            <MapComponent
              issues={filteredIssues}
              selectedIssue={selectedIssue}
              onSelectIssue={setSelectedIssue}
              onSelectLocationForNewIssue={handleSelectLocationForNewIssue}
              isSelectingLocationMode={isSelectingLocationMode}
              selectedLocation={selectedLocation}
            />

             {/* Clicked Map Pin Info Overlay Popup */}
            <AnimatePresence>
              {selectedIssue && (
                <IssuePopup
                  issue={selectedIssue}
                  allIssues={issues}
                  currentUserId={user.id}
                  onClose={() => setSelectedIssue(null)}
                  onReact={handleReactToIssue}
                  onUpdateStatus={handleUpdateStatus} // Admin simulation tools!
                  onAddPerspective={handleAddPerspective}
                  onSelectPerspective={setSelectedIssue}
                />
              )}
            </AnimatePresence>
          </div>

          {/* View 2: Social Feed */}
          <div className={`w-full h-full absolute inset-0 overflow-y-auto px-4 py-6 ${view === "feed" ? "block" : "hidden"}`}>
            <SocialFeed
              issues={issues}
              currentUserId={user.id}
              onSelectIssue={(issue) => {
                setSelectedIssue(issue);
                setView("map"); // Swaps to map to focus and show info popup
                triggerToast(`Centering map on: ${issue.title}`);
              }}
              onReact={handleReactToIssue}
            />
          </div>

          {/* View 3: Report Form */}
          <div className={`w-full h-full absolute inset-0 overflow-y-auto px-4 py-6 ${view === "report" ? "block" : "hidden"}`}>
            <ReportForm
              onSubmit={handleReportSubmit}
              onCancel={() => {
                setSelectedLocation(null);
                setIsSelectingLocationMode(false);
                setPreLinkedParentIssue(null);
                setView("map");
              }}
              selectedLocation={selectedLocation}
              parentIssueId={preLinkedParentIssue?.id}
              parentIssue={preLinkedParentIssue}
              onClearParentIssue={() => {
                setPreLinkedParentIssue(null);
                setSelectedLocation(null);
              }}
              onEnterLocationSelectionMode={handleEnterLocationSelectionMode}
              onSelectLocation={handleSelectLocationForNewIssue}
            />
          </div>

          {/* View 4: Profile & Dashboard combined */}
          <div className={`w-full h-full absolute inset-0 overflow-y-auto px-4 py-6 ${view === "profile" ? "block" : "hidden"}`}>
            <div className="max-w-lg mx-auto mb-4 bg-[#0A0A0A]/90 border border-gray-800 rounded-xl p-1 flex">
              <button
                onClick={() => setProfileSubTab("registry")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  profileSubTab === "registry"
                    ? "bg-brand text-[#0A0A0A] shadow font-black"
                    : "text-gray-400 hover:text-white"
                }`}
                id="profile-subtab-registry"
              >
                👤 My Profile
              </button>
              <button
                onClick={() => setProfileSubTab("dashboard")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  profileSubTab === "dashboard"
                    ? "bg-brand text-[#0A0A0A] shadow font-black"
                    : "text-gray-400 hover:text-white"
                }`}
                id="profile-subtab-dashboard"
              >
                📊 Impact Dashboard
              </button>
            </div>

            {profileSubTab === "registry" ? (
              <UserProfile
                user={user}
                issues={issues}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                onSelectIssue={(issue) => {
                  setSelectedIssue(issue);
                  setView("map"); // Swaps to map to highlight selected history complaint
                }}
              />
            ) : (
              <AnalyticsDashboard metrics={dashboardMetrics} />
            )}
          </div>

        </div>
      </main>

      {/* Global Bottom Navigation bar */}
      {user && (
        <nav className="px-4 py-2 bg-[#0A0A0A]/95 border-t border-gray-900 flex items-center justify-around shrink-0 z-50 shadow-lg backdrop-blur">
          {/* Map Feed tab */}
          <button
            onClick={() => {
              setView("map");
              setIsSelectingLocationMode(false);
            }}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              view === "map" ? "text-brand scale-105 bg-brand/5 font-extrabold" : "text-gray-400 hover:text-white"
            }`}
            id="nav-map-btn"
          >
            <Map className="w-5 h-5" />
            <span className="text-[8px] font-mono uppercase tracking-wide">Map</span>
          </button>

          {/* Social Feed Tab */}
          <button
            onClick={() => {
              setView("feed");
              setIsSelectingLocationMode(false);
            }}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              view === "feed" ? "text-brand scale-105 bg-brand/5 font-extrabold" : "text-gray-400 hover:text-white"
            }`}
            id="nav-feed-btn"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[8px] font-mono uppercase tracking-wide">Civic Tea</span>
          </button>

          {/* Report Tab */}
          <button
            onClick={() => {
              setView("report");
              setIsSelectingLocationMode(false);
            }}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              view === "report" ? "text-brand scale-105 bg-brand/5 font-extrabold" : "text-gray-400 hover:text-white"
            }`}
            id="nav-report-btn"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[8px] font-mono uppercase tracking-wide">Post</span>
          </button>

          {/* Profile tab */}
          <button
            onClick={() => {
              setView("profile");
              setIsSelectingLocationMode(false);
            }}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              view === "profile" ? "text-brand scale-105 bg-brand/5 font-extrabold" : "text-gray-400 hover:text-white"
            }`}
            id="nav-profile-btn"
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[8px] font-mono uppercase tracking-wide">Profile</span>
          </button>
        </nav>
      )}

      {/* Global Interactive Float Notifications (Toast) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-20 left-4 right-4 z-50 max-w-sm mx-auto pointer-events-none"
          >
            <div className="px-3 py-2.5 bg-brand border border-brand text-[#0A0A0A] text-xs font-black rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur">
              <Sparkles className="w-4 h-4 text-[#0A0A0A] animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
