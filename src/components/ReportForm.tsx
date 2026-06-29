/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Category } from "../types";
import { Camera, MapPin, Sparkles, Check, Loader2, AlertCircle, EyeOff, ShieldAlert, ArrowLeft, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportFormProps {
  onSubmit: (data: {
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
  }) => Promise<void>;
  onCancel: () => void;
  selectedLocation: { lat: number; lng: number; area: string } | null;
  parentIssueId?: string;
  parentIssue?: any | null;
  onClearParentIssue?: () => void;
  onEnterLocationSelectionMode: () => void;
  onSelectLocation: (lat: number, lng: number, area: string) => void;
}

const CATEGORY_ITEMS: { value: Category; label: string; icon: string; desc: string; color: string }[] = [
  { value: "Civic Issue", label: "Civic Issue", icon: "🏢", desc: "General civic, public safety or infrastructure problems", color: "border-indigo-500/20 hover:border-indigo-500 bg-indigo-950/20" },
  { value: "Pothole", label: "Pothole Crater", icon: "🕳️", desc: "Damaged tarmac, road pits, or broken paths", color: "border-orange-500/20 hover:border-orange-500 bg-orange-950/20" },
  { value: "Flooding", label: "Flooding & Waterlog", icon: "🌊", desc: "Monsoon floods, waterlogging, or choked drains", color: "border-blue-500/20 hover:border-blue-500 bg-blue-950/20" },
  { value: "Power Cut", label: "Power Cut / Outage", icon: "🔌", desc: "Electricity cuts, blackouts, or broken streetlights", color: "border-yellow-500/20 hover:border-yellow-500 bg-yellow-950/20" },
  { value: "Garbage", label: "Garbage & Waste", icon: "🗑️", desc: "Accumulated trash, dirty dumps, or overflowing bins", color: "border-amber-700/20 hover:border-amber-700 bg-amber-950/20" },
  { value: "Corruption", label: "Corruption & Graft", icon: "💼", desc: "Bribery, misuse of power, or shady transactions", color: "border-red-500/20 hover:border-red-500 bg-red-950/20" },
  { value: "Government Failure", label: "Government Failure", icon: "🏛️", desc: "Neglect of civic infrastructure, offices or services", color: "border-red-700/20 hover:border-red-700 bg-red-950/25" },
  { value: "Protest / Rally", label: "Protest / Rally", icon: "📣", desc: "Demonstrations, rallies, assemblies, or blockades", color: "border-pink-500/20 hover:border-pink-500 bg-pink-950/20" },
  { value: "Local Drama", label: "Local Drama / Chaos", icon: "🍵", desc: "Gossip, public chaos, street fights, or neighbor drama", color: "border-teal-500/20 hover:border-teal-500 bg-teal-950/20" },
  { value: "Argument / Dispute", label: "Argument / Dispute", icon: "🗣️", desc: "Public disagreements, disputes, or screaming matches", color: "border-rose-500/20 hover:border-rose-500 bg-rose-950/20" },
  { value: "Harassment", label: "Harassment", icon: "⚠️", desc: "Unsafe environment, catcalling, or intimidation", color: "border-red-600/20 hover:border-red-600 bg-red-950/20" },
  { value: "Breaking News", label: "Breaking News", icon: "📰", desc: "Live incidents, unfolding updates, or emergency announcements", color: "border-cyan-500/20 hover:border-cyan-500 bg-cyan-950/20" },
  { value: "Village Problem", label: "Village Problem", icon: "🏡", desc: "Rural or localized community issues", color: "border-green-500/20 hover:border-green-500 bg-green-950/20" },
  { value: "Weather", label: "Weather Conditions", icon: "☁️", desc: "Heavy rain, storms, extreme heat, or dense fog", color: "border-sky-500/20 hover:border-sky-500 bg-sky-950/20" },
  { value: "War / Conflict", label: "War / Conflict", icon: "💥", desc: "Active clashes, structural damage, or violent skirmishes", color: "border-gray-700/20 hover:border-gray-500 bg-gray-950/20" },
  { value: "Other", label: "Other Issues", icon: "❓", desc: "Any other hyperlocal issues or bulletins", color: "border-gray-500/20 hover:border-gray-500 bg-gray-950/20" }
];

export default function ReportForm({
  onSubmit,
  onCancel,
  selectedLocation,
  parentIssueId,
  parentIssue,
  onClearParentIssue,
  onEnterLocationSelectionMode,
  onSelectLocation
}: ReportFormProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [useAI, setUseAI] = useState(true);

  // Gemini real-time states
  const [isAiReading, setIsAiReading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    category: Category;
    title: string;
    isSpam: boolean;
    spamReasoning: string;
  } | null>(null);
  const [showAiCard, setShowAiCard] = useState(false);

  const [isAiVisionLoading, setIsAiVisionLoading] = useState(false);
  const [aiVisionResult, setAiVisionResult] = useState<{
    description: string;
    suggestedCategory: Category;
  } | null>(null);

  const lastAnalyzedTextRef = useRef("");

  useEffect(() => {
    if (!description || description.trim().length < 10) {
      setAiAnalysisResult(null);
      setShowAiCard(false);
      setIsAiReading(false);
      return;
    }

    if (description === lastAnalyzedTextRef.current) {
      return;
    }

    setIsAiReading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/gemini/analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description })
        });
        if (response.ok) {
          const data = await response.json();
          setAiAnalysisResult(data);
          setShowAiCard(true);
          lastAnalyzedTextRef.current = description;
        }
      } catch (err) {
        console.error("Failed to analyze description via real-time Gemini:", err);
      } finally {
        setIsAiReading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description]);

  const analyzePhotoWithAi = async (photoBase64: string) => {
    setIsAiVisionLoading(true);
    setAiVisionResult(null);
    try {
      const response = await fetch("/api/gemini/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: photoBase64 })
      });
      if (response.ok) {
        const data = await response.json();
        setAiVisionResult(data);
        if (data.suggestedCategory && data.suggestedCategory !== "Other") {
          setCategory(data.suggestedCategory);
        }
      }
    } catch (err) {
      console.error("Failed to analyze photo via real-time Gemini Vision:", err);
    } finally {
      setIsAiVisionLoading(false);
    }
  };

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "detecting" | "success" | "error">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback neighborhoods list for manual selection if map tapping is skipped
  const [manualArea, setManualArea] = useState("");

  // Dynamically generated nearby areas based on detected/active GPS coords or standard fallbacks
  const getNearbyAreas = () => {
    if (selectedLocation) {
      const lat = selectedLocation.lat;
      const lng = selectedLocation.lng;
      return [
        { name: `${selectedLocation.area || "Current Spot"} (Central)`, lat, lng },
        { name: `North Ward`, lat: lat + 0.015, lng: lng },
        { name: `South Ward`, lat: lat - 0.015, lng: lng },
        { name: `East Hub`, lat: lat, lng: lng + 0.015 },
        { name: `West End`, lat: lat, lng: lng - 0.015 },
      ];
    }

    // Default fallback neighborhoods (Worldwide/Generic seeds location-agnostic)
    return [
      { name: "Central Square", lat: 19.0180, lng: 72.8430 },
      { name: "West End", lat: 19.0654, lng: 72.8251 },
      { name: "Metro Center", lat: 19.0728, lng: 72.8826 },
      { name: "Tech District", lat: 19.1176, lng: 72.9060 },
      { name: "South Harbor", lat: 18.9067, lng: 72.8147 },
      { name: "North District", lat: 19.1197, lng: 72.8468 },
      { name: "Sunset Beach", lat: 18.9431, lng: 72.8230 },
      { name: "Commercial District", lat: 19.1828, lng: 72.9612 },
    ];
  };

  const nearbyAreas = getNearbyAreas();

  // Geolocation detector (fully worldwide and location-agnostic)
  const handleAutoGPS = () => {
    setLocationStatus("detecting");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setErrorMessage("HTML5 Geolocation is not supported by your browser. Please tap the map or select a neighborhood.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Set the active selected location via parent handler instantly
        // Attempt to find a descriptive area or reverse-geocode it
        const areaName = "Detected Location";
        onSelectLocation(lat, lng, areaName);
        setLocationStatus("success");
      },
      (error) => {
        console.warn("Geolocation API failed inside iframe container:", error);
        setLocationStatus("error");
        setErrorMessage("Auto GPS request blocked or unavailable in sandbox. Please tap on map or select neighborhood manually.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Convert uploaded files to base64 representations (supporting up to 5 photos or 1 video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    const hasVideo = fileList.some(f => f.type.startsWith("video/"));
    
    if (hasVideo) {
      // 1 video limit
      const videoFile = fileList.find(f => f.type.startsWith("video/"))!;
      if (videoFile.size > 25 * 1024 * 1024) {
        setErrorMessage("Video exceeds 25MB limit. Please upload a smaller video clip.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrls([reader.result as string]);
        setMediaType("video");
        setPhotoUrl(""); // clear for legacy compatibility
        setErrorMessage("");
      };
      reader.readAsDataURL(videoFile);
    } else {
      // Photo files (up to 5)
      const imageFiles = fileList.filter(f => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        setErrorMessage("Please select valid image or video files.");
        return;
      }
      
      let processed = 0;
      const results: string[] = [];
      setMediaType("photo");
      
      imageFiles.forEach(file => {
        if (file.size > 8 * 1024 * 1024) {
          setErrorMessage("One or more photos exceed 8MB limit.");
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          results.push(reader.result as string);
          processed++;
          if (processed === imageFiles.length) {
            setMediaUrls(prev => {
              // combine and limit to 5
              const updated = [...prev, ...results].slice(0, 5);
              if (updated.length > 0) {
                setPhotoUrl(updated[0]); // legacy compatibility
                analyzePhotoWithAi(updated[0]);
              }
              return updated;
            });
            setErrorMessage("");
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleManualAreaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const areaName = e.target.value;
    setManualArea(areaName);
    const found = nearbyAreas.find(n => n.name === areaName);
    if (found) {
      // Create a default location pin based on the neighborhood center
      onSelectLocation(found.lat, found.lng, found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!category) {
      setErrorMessage("Please select a category in STEP 2 before submitting.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please enter a clear description of the civic issue.");
      return;
    }

    // Determine final latitude and longitude (India-wide seed fallback if absolutely nothing chosen)
    let finalLat = 20.5937;
    let finalLng = 78.9629;

    if (selectedLocation) {
      finalLat = selectedLocation.lat;
      finalLng = selectedLocation.lng;
    } else if (manualArea) {
      const found = nearbyAreas.find(n => n.name === manualArea);
      if (found) {
        finalLat = found.lat;
        finalLng = found.lng;
      }
    } else {
      setErrorMessage("Please select a report location on the map, trigger GPS, or pick a neighborhood.");
      return;
    }

    setIsPending(true);

    try {
      await onSubmit({
        description,
        category: useAI ? "" : (category as Category),
        photoUrl,
        mediaUrls,
        mediaType,
        parentIssueId,
        lat: finalLat,
        lng: finalLng,
        isAnonymous,
        useAI
      });
      setSuccessMsg("Civic issue successfully logged on GroundZero radar!");
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong while posting your report.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0A0A0A]/95 border border-gray-900 rounded-xl shadow-xl overflow-hidden p-4 md:p-6 text-white" id="report-creation-view">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg bg-[#141414] text-gray-400 hover:text-brand transition-all mr-1 cursor-pointer"
          id="report-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-brand tracking-tight uppercase">What's happening around you?</h2>
          <p className="text-[10px] text-gray-400 font-mono">BE THE REPORTER IN YOUR NEIGHBORHOOD</p>
        </div>
      </div>

      {/* Linked Incident Banner if pre-linked parent post is active */}
      {parentIssue && (
        <div className="mb-4 p-3 bg-brand/10 border border-brand/30 rounded-xl flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔗</span>
            <div>
              <p className="font-bold text-brand">Linked to Incident</p>
              <p className="text-[10px] text-gray-300 line-clamp-1">"{parentIssue.title}"</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearParentIssue}
            className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
          >
            Unlink
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Upload Photo / Video (up to 5 photos or 1 video) */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
            STEP 1: SNAP & UPLOAD EVIDENCE (UP TO 5 PHOTOS OR 1 VIDEO)
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="report-photo-input"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center bg-[#0A0A0A] hover:border-brand/50 cursor-pointer transition-all gap-1 text-gray-400"
            id="upload-placeholder-box"
          >
            <Camera className="w-6 h-6 text-gray-500 hover:text-brand transition-all" />
            <span className="text-xs font-semibold">Upload Photos or Video / Capture</span>
            <span className="text-[9px] text-gray-600 font-mono">Max 5 Photos or 1 Video clip (Max 25MB video, 8MB photo)</span>
          </div>

          {/* Horizontal scrollable thumbnail row */}
          {mediaUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2.5 mt-2 scrollbar-thin">
              {mediaUrls.map((url, idx) => {
                const isUrlVideo = mediaType === "video" || url.startsWith("data:video/");
                return (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-800 shrink-0 bg-black/40 group">
                    {isUrlVideo ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaUrls(prev => {
                          const updated = prev.filter((_, i) => i !== idx);
                          if (updated.length > 0) {
                            setPhotoUrl(updated[0]);
                          } else {
                            setPhotoUrl("");
                          }
                          return updated;
                        });
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[8px] font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-center font-mono py-0.5">
                      {isUrlVideo ? "VIDEO" : `IMG ${idx+1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isAiVisionLoading && (
            <div className="flex items-center gap-1.5 mt-2.5 p-2 bg-brand/5 border border-brand/10 rounded-lg text-brand text-[10px] font-mono uppercase tracking-wide animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
              <span>👁️ Gemini Vision is inspecting uploaded evidence...</span>
            </div>
          )}

          {aiVisionResult && (
            <div className="mt-2.5 p-3 bg-[#111111] border border-brand/20 rounded-lg space-y-1.5" id="gemini-vision-card">
              <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                👁️ <span className="font-semibold text-brand">AI sees:</span> {aiVisionResult.description}
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-gray-400">
                <span>✅ Auto-suggested category:</span>
                <span className="px-2 py-0.5 bg-brand text-[#0A0A0A] rounded font-black">{aiVisionResult.suggestedCategory}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: SELECT CATEGORY */}
        <div className="space-y-1.5" id="manual-category-section">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
            STEP 2: SELECT CATEGORY
          </label>
          
          <div className="flex gap-1.5 overflow-x-auto py-1.5 scrollbar-thin">
            {CATEGORY_ITEMS.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => {
                  setCategory(item.value);
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  category === item.value
                    ? "bg-brand text-[#0A0A0A] border-brand font-black"
                    : "bg-[#141414] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white"
                }`}
                id={`manual-cat-${item.value}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Auto-categorize switch */}
        <div className="flex items-center justify-between p-2.5 bg-brand/5 border border-brand/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand animate-pulse" />
            <div>
              <p className="text-xs font-bold text-brand">Gemini AI Auto-Categorizer</p>
              <p className="text-[9px] text-gray-400">Classifies categories & crafts specific titles instantly</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUseAI(!useAI);
            }}
            className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${useAI ? "bg-brand" : "bg-gray-800"}`}
            id="ai-categorize-toggle"
          >
            <div className={`w-5 h-5 rounded-full bg-[#0A0A0A] transition-transform ${useAI ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Step 3: Description */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
            STEP 3: DETAILED CIVIC DESCRIPTION
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Tell your story. What did you see, hear, or experience? Be the reporter."
            className="w-full px-3 py-2 text-xs bg-[#0A0A0A] border border-gray-900 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-brand/60 font-sans resize-none"
            id="report-desc-textarea"
          />

          {isAiReading && (
            <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-[10px] font-mono uppercase tracking-wide animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI is reading your report...</span>
            </div>
          )}

          {/* Gemini Real-time Text Analysis Card */}
          <AnimatePresence>
            {showAiCard && aiAnalysisResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-emerald-950/20 border-2 border-emerald-500/30 rounded-xl space-y-3 relative overflow-hidden"
                id="gemini-ai-analysis-card"
              >
                {/* Corner Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <p className="text-xs font-black text-emerald-400 font-sans flex items-center gap-1.5">
                      🤖 AI detected: {aiAnalysisResult.category}
                    </p>
                    <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                      📰 <span className="font-semibold text-emerald-300">Suggested headline:</span> "{aiAnalysisResult.title}"
                    </p>
                    <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-wider font-bold">
                      ✅ Auto-selected category: {aiAnalysisResult.category}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(aiAnalysisResult.category);
                      setUseAI(true);
                      setSuccessMsg(`Applied suggested category "${aiAnalysisResult.category}" & dynamic headline!`);
                      setTimeout(() => setSuccessMsg(""), 3000);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-mono font-black uppercase rounded-lg transition-all flex items-center gap-1 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>Use this</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUseAI(false);
                      setSuccessMsg("Manual override active. Please pick category & enter headline manually.");
                      setTimeout(() => setSuccessMsg(""), 3000);
                    }}
                    className="px-3 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-300 hover:text-white border border-gray-800 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer"
                  >
                    Edit manually
                  </button>
                </div>

                {/* Small "Powered by Gemini" badge */}
                <div className="pt-2.5 border-t border-emerald-500/10 flex items-center justify-between text-[8px] text-emerald-500/60 font-mono uppercase tracking-widest">
                  <span>RADAR AI CORE v1.0</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    Powered by Gemini
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 4: Coordinates Location selection */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
            STEP 4: REPORT LOCATION & AREA
          </label>
          
          <div className="flex flex-col gap-2">
            {/* Map tapping trigger button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEnterLocationSelectionMode}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  selectedLocation
                    ? "bg-[#141414] text-brand border-brand/50"
                    : "bg-brand text-[#0A0A0A] border-brand hover:bg-brand/90 font-black"
                }`}
                id="select-on-map-btn"
              >
                <MapPin className="w-3.5 h-3.5" />
                {selectedLocation ? "Location Locked on Map" : "Tap Location on Map"}
              </button>

              <button
                type="button"
                onClick={handleAutoGPS}
                disabled={locationStatus === "detecting"}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-[#141414] border border-gray-800 hover:border-gray-700 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                id="gps-trigger-btn"
              >
                {locationStatus === "detecting" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>Auto GPS</span>
              </button>
            </div>

            {/* Displaying selected location */}
            {selectedLocation ? (
              <div className="px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded text-[10px] text-green-400 flex items-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Locked Coords: ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}) at {selectedLocation.area}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-500 font-sans italic">OR Choose Nearest Ward Neighborhood Center:</span>
                <select
                  value={manualArea}
                  onChange={handleManualAreaSelect}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0A0A0A] border border-gray-900 rounded text-gray-300 focus:outline-none"
                  id="neighborhood-manual-select"
                >
                  <option value="">-- Choose Ward Neighborhood --</option>
                  {nearbyAreas.map(n => (
                    <option key={n.name} value={n.name}>{n.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Anonymous Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-[#0A0A0A] border border-gray-900 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-300">Submit Anonymously</p>
              <p className="text-[9px] text-gray-500">Your real name won't be visible to others</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${isAnonymous ? "bg-brand" : "bg-gray-800"}`}
            id="anonymous-report-toggle"
          >
            <div className={`w-5 h-5 rounded-full bg-[#0A0A0A] transition-transform ${isAnonymous ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Errors & Success Feedback */}
        {errorMessage && (
          <div className="p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-green-600/10 border border-green-500/30 rounded-lg text-xs text-green-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-2.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
            id="report-cancel-btn"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isPending}
            className="flex-[2] py-2.5 bg-brand hover:bg-brand/90 text-[#0A0A0A] rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand/25 cursor-pointer"
            id="report-submit-btn"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                <span>{useAI ? "Gemini Auto-Detecting..." : "Logging to Radar..."}</span>
              </>
            ) : (
              <>
                <span>POST TO GROUNDZERO</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
