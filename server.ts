/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Category, Status, Issue, User, ReactionType } from "./src/types";

dotenv.config();

// Initialize Gemini SDK lazily
let aiInstance: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiInstance = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("Successfully initialized Gemini AI SDK");
      } catch (e) {
        console.error("Failed to initialize Gemini AI SDK:", e);
      }
    } else {
      console.log("No valid GEMINI_API_KEY found, using local fallback");
    }
  }
  return aiInstance;
}

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "issues.json");

// Helper to save issues to local file
function saveIssues(issues: Issue[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(issues, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving issues to JSON:", err);
  }
}

// Helper to load issues from file or fall back to seeds
function loadIssues(): Issue[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content) as Issue[];
    }
  } catch (err) {
    console.error("Error loading issues from JSON, falling back to seeds:", err);
  }

  // Seed data for generic worldwide issues
  const seeds: Issue[] = [
    {
      id: "seed-1",
      title: "Spotted: Two Celebrities Arguing at Cafe West! 💀",
      description: "Bro, absolute cinema outside a cafe in the West End. Two major celebrities were having a full-blown verbal dispute. The paparazzi are starting to arrive. Crowd is gathering fast! Total drama.",
      category: "Local Drama",
      status: "Verified",
      lat: 19.0654,
      lng: 72.8251,
      area: "West End",
      reporterId: "user-3",
      reporterName: "Priya Sharma",
      reporterTrustScore: 88,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
      reactions: { verified: 34, cap: 2, big_issue: 12, bruh: 56 },
      userReactions: { "user-2": "bruh", "user-4": "verified" },
      aiDescription: "AI Vision analysis: Visual shows a large crowd of people holding up phones outside a glass-facade West End cafe."
    },
    {
      id: "seed-2",
      title: "Massive Student Protest Blockade 📣",
      description: "Central avenue blocked by a huge student march demanding exam reschedule. Heavy chanting and holding signs. Traffic is absolutely cooked. Shuttles are turning back. Avoid Central Square stretch completely!",
      category: "Protest / Rally",
      status: "Verified",
      lat: 19.0180,
      lng: 72.8430,
      area: "Central Square",
      reporterId: "user-2",
      reporterName: "Rajesh Kumar",
      reporterTrustScore: 85,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      reactions: { verified: 45, cap: 1, big_issue: 28, bruh: 15 },
      userReactions: { "user-3": "big_issue" },
      aiDescription: "AI Vision analysis: A large crowd of students carrying cardboard signs marching on a multi-lane concrete road near Central Square."
    },
    {
      id: "seed-3",
      title: "Absolute Waterlogging at Subway Underpass 🌊",
      description: "It rained for just 30 minutes and the entire underpass stretch is already a swimming pool. Water is literally door-level for sedans. Shuttles are refusing to go ahead. This happens every single year, no cap.",
      category: "Flooding",
      status: "Verified",
      lat: 19.0195,
      lng: 72.8440,
      area: "Central Square",
      reporterId: "user-5",
      reporterName: "Ananya Iyer",
      reporterTrustScore: 92,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      reactions: { verified: 22, cap: 0, big_issue: 35, bruh: 8 },
      userReactions: {}
    },
    {
      id: "seed-4",
      title: "Main Street Pothole is Literally a Crater 🕳️",
      description: "Right after the West End traffic light, on the middle lane, there is a legendary pothole. Just saw a scooter almost fly off. It is deep enough to swallow a whole wheel. High key hazard, watch out folks!",
      category: "Pothole",
      status: "Reported",
      lat: 19.0624,
      lng: 72.8221,
      area: "West End",
      reporterId: "user-4",
      reporterName: "Aarav Mehta",
      reporterTrustScore: 75,
      isAnonymous: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
      reactions: { verified: 12, cap: 1, big_issue: 9, bruh: 5 },
      userReactions: {}
    },
    {
      id: "seed-5",
      title: "Power Cut Blackout in Tech Galleria 🔌",
      description: "Galleria commercial strip has been pitch black for 3 hours. Shops are running on noisy generators. Streetlights are also down, making the walking path unsafe. Total blackout vibe.",
      category: "Power Cut",
      status: "Reported",
      lat: 19.1176,
      lng: 72.9060,
      area: "Tech District",
      reporterId: "user-7",
      reporterName: "Siddharth Joshi",
      reporterTrustScore: 50,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
      reactions: { verified: 18, cap: 2, big_issue: 14, bruh: 3 },
      userReactions: {}
    },
    {
      id: "seed-6",
      title: "GenZ Flash Mob Event at Waterfront Promenade 🕺",
      description: "Wait, there's a huge flash mob dance happening right now on the seafront! Over 100 college students dancing to trending beats. The energy is immaculate. Check it out if you're nearby!",
      category: "Local Drama",
      status: "Verified",
      lat: 19.0596,
      lng: 72.8210,
      area: "West End",
      reporterId: "user-6",
      reporterName: "Vikram Malhotra",
      reporterTrustScore: 58,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
      reactions: { verified: 28, cap: 3, big_issue: 4, bruh: 42 },
      userReactions: {}
    },
    {
      id: "seed-7",
      title: "Trash Mountain Overflows at Harbor Dock 🤢",
      description: "Market waste, rotten cardboard, and single-use plastic dumped right on the sidewalk. The smell is literally biological warfare. Local stray dogs are scattering it everywhere. Clear this up ASAP!",
      category: "Garbage",
      status: "Escalated",
      lat: 18.9067,
      lng: 72.8147,
      area: "South Harbor",
      reporterId: "user-9",
      reporterName: "Meera Fernandez",
      reporterTrustScore: 89,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      reactions: { verified: 30, cap: 0, big_issue: 22, bruh: 11 },
      userReactions: {}
    },
    {
      id: "seed-8",
      title: "Chain Snatching Incident on Beach Road ⚠️",
      description: "Be careful tonight. Two guys on a black motorcycle snatched a purse and chain from a couple walking near Sunset Beach. They fled towards North District. Absolutely scary, watch your surroundings.",
      category: "Harassment",
      status: "Escalated",
      lat: 19.0988,
      lng: 72.8264,
      area: "Sunset Beach",
      reporterId: "user-8",
      reporterName: "Rohan Sawant",
      reporterTrustScore: 98,
      isAnonymous: false,
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
      reactions: { verified: 48, cap: 1, big_issue: 39, bruh: 6 },
      userReactions: {}
    }
  ];

  saveIssues(seeds);
  return seeds;
}

// In-memory active stores
let activeIssues: Issue[] = loadIssues();

// Simple in-memory user table initialized with seed reporters
const activeUsers: Record<string, User> = {
  "user-2": { id: "user-2", name: "Rajesh Kumar", email: "rajesh@groundzero.in", trustScore: 85 },
  "user-3": { id: "user-3", name: "Priya Sharma", email: "priya@groundzero.in", trustScore: 88 },
  "user-4": { id: "user-4", name: "Aarav Mehta", email: "aarav@groundzero.in", trustScore: 75 },
  "user-5": { id: "user-5", name: "Ananya Iyer", email: "ananya@groundzero.in", trustScore: 92 },
  "user-6": { id: "user-6", name: "Vikram Malhotra", email: "vikram@groundzero.in", trustScore: 58 },
  "user-7": { id: "user-7", name: "Siddharth Joshi", email: "siddharth@groundzero.in", trustScore: 50 },
  "user-8": { id: "user-8", name: "Rohan Sawant", email: "rohan@groundzero.in", trustScore: 98 },
  "user-9": { id: "user-9", name: "Meera Fernandez", email: "meera@groundzero.in", trustScore: 89 },
};

// Helper to dynamically calculate any user's trust score based on reactions on their reports
function recalculateUserTrustScore(userId: string): number {
  const userIssues = activeIssues.filter(i => i.reporterId === userId);
  if (userIssues.length === 0) {
    return 50;
  }

  let score = 50; // Base score
  userIssues.forEach(issue => {
    // ✅ Verified (+5), 🧢 Cap (-12), 🔥 Big Issue (+2), 💀 Bruh (+1)
    const vCount = issue.reactions.verified || 0;
    const cCount = issue.reactions.cap || 0;
    const bCount = issue.reactions.big_issue || 0;
    const brCount = issue.reactions.bruh || 0;

    score += (vCount * 5);
    score -= (cCount * 12); // Severe penalty for Cap (fake reports)
    score += (bCount * 2);
    score += (brCount * 1);

    // Also factor in status changes
    if (issue.status === "Verified") score += 10;
    if (issue.status === "Escalated") score += 15;
    if (issue.status === "Resolved") score += 25;
  });

  // Clamp trust score between 10 and 100
  const finalScore = Math.min(100, Math.max(10, score));
  if (activeUsers[userId]) {
    activeUsers[userId].trustScore = finalScore;
  }
  return finalScore;
}

// Map coordinates to neighborhood / area name
function getAreaFromCoords(lat: number, lng: number): string {
  const points = [
    { name: "South Harbor", lat: 18.9067, lng: 72.8147 },
    { name: "Sunset Beach", lat: 18.9431, lng: 72.8230 },
    { name: "Central Square", lat: 19.0180, lng: 72.8430 },
    { name: "West End", lat: 19.0654, lng: 72.8251 },
    { name: "Metro Center", lat: 19.0728, lng: 72.8826 },
    { name: "Tech District", lat: 19.1176, lng: 72.9060 },
    { name: "North District", lat: 19.1197, lng: 72.8468 },
    { name: "Commercial District", lat: 19.1828, lng: 72.9612 },
  ];

  let closest = points[0];
  let minDist = Infinity;
  for (const pt of points) {
    const dist = Math.sqrt(Math.pow(pt.lat - lat, 2) + Math.pow(pt.lng - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      closest = pt;
    }
  }

  // If the closest point is too far (e.g. outside our mock coordinate area), return a coordinate-based Zone label!
  if (minDist > 0.5) {
    return `Zone (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
  }

  return closest.name;
}

// AI Auto-categorizer + photo analysis + spam checker
async function autoCategorizeWithAI(
  description: string,
  photoBase64?: string
): Promise<{
  category: Category;
  title: string;
  aiDescription: string;
  isSpam: boolean;
  spamReasoning: string;
}> {
  const categories: Category[] = [
    "Civic Issue",
    "Pothole",
    "Flooding",
    "Power Cut",
    "Garbage",
    "Corruption",
    "Government Failure",
    "Protest / Rally",
    "Local Drama",
    "Argument / Dispute",
    "Harassment",
    "Breaking News",
    "Village Problem",
    "Weather",
    "War / Conflict",
    "Other"
  ];
  const defaultRes = {
    category: "Other" as Category,
    title: description.substring(0, 35) + "...",
    aiDescription: "AI verified local citizen report.",
    isSpam: false,
    spamReasoning: ""
  };

  // Heuristics Fallback First
  const textLower = description.toLowerCase();
  if (textLower.includes("pothole") || textLower.includes("crater") || textLower.includes("road")) {
    defaultRes.category = "Pothole";
    defaultRes.title = "Main Street Pothole Crater! 🕳️";
  } else if (textLower.includes("flood") || textLower.includes("water") || textLower.includes("rain") || textLower.includes("waterlogging") || textLower.includes("storm")) {
    defaultRes.category = "Flooding";
    defaultRes.title = "Waterlogging Chaos! 🌊";
  } else if (textLower.includes("fight") || textLower.includes("drama") || textLower.includes("spotted") || textLower.includes("celeb") || textLower.includes("gossip")) {
    defaultRes.category = "Local Drama";
    defaultRes.title = "West End Street Drama Spotted! 💀";
  } else if (textLower.includes("protest") || textLower.includes("strike") || textLower.includes("march") || textLower.includes("rally")) {
    defaultRes.category = "Protest / Rally";
    defaultRes.title = "Huge Protest Blockade! 📣";
  } else if (textLower.includes("power") || textLower.includes("blackout") || textLower.includes("electricity") || textLower.includes("outage")) {
    defaultRes.category = "Power Cut";
    defaultRes.title = "Sudden Power Blackout! 🔌";
  } else if (textLower.includes("corruption") || textLower.includes("bribe") || textLower.includes("graft") || textLower.includes("shady")) {
    defaultRes.category = "Corruption";
    defaultRes.title = "Local Corruption Allegation! 💼";
  } else if (textLower.includes("harassment") || textLower.includes("catcall") || textLower.includes("unsafe")) {
    defaultRes.category = "Harassment";
    defaultRes.title = "Harassment Alert Active! ⚠️";
  } else if (textLower.includes("garbage") || textLower.includes("waste") || textLower.includes("trash")) {
    defaultRes.category = "Garbage";
    defaultRes.title = "Unregulated Trash Dumping! 🗑️";
  } else if (textLower.includes("village") || textLower.includes("rural")) {
    defaultRes.category = "Village Problem";
    defaultRes.title = "Village Community Report! 🏡";
  } else if (textLower.includes("weather") || textLower.includes("temperature") || textLower.includes("fog") || textLower.includes("heat")) {
    defaultRes.category = "Weather";
    defaultRes.title = "Weather Conditions Alert! ☁️";
  } else if (textLower.includes("war") || textLower.includes("clash") || textLower.includes("conflict")) {
    defaultRes.category = "War / Conflict";
    defaultRes.title = "Local Conflict Escalated! 💥";
  } else if (textLower.includes("breaking") || textLower.includes("alert")) {
    defaultRes.category = "Breaking News";
    defaultRes.title = "Hyperlocal Breaking News! 📰";
  } else if (textLower.includes("government") || textLower.includes("municipal") || textLower.includes("failure")) {
    defaultRes.category = "Government Failure";
    defaultRes.title = "Government Service Failure! 🏛️";
  }

  // Check if text is gibberish or spamby by simple heuristics
  if (description.length < 5 || textLower.includes("buy cheap") || textLower.includes("promo code") || textLower.includes("test test")) {
    defaultRes.isSpam = true;
    defaultRes.spamReasoning = "Suspicious spam pattern detected (Heuristics)";
  }

  const ai = getGeminiAI();
  if (!ai) {
    return defaultRes;
  }

  try {
    const prompt = `
You are GroundZero Civic & Local News AI. Your role is to classify, title, and analyze citizen reports worldwide, with a modern, alert, hyperlocal citizen-journalist tone.
Given the text description and optional image, return a JSON object ONLY.

Your response MUST be a JSON object with this exact structure:
{
  "category": "one of: Civic Issue, Pothole, Flooding, Power Cut, Garbage, Corruption, Government Failure, Protest / Rally, Local Drama, Argument / Dispute, Harassment, Breaking News, Village Problem, Weather, War / Conflict, Other",
  "title": "A super punchy, Gen-Z / hyperlocal citizen news headline (4-8 words), using appropriate emojis (e.g. 'Traffic is Absolutely Cooked 💀')",
  "aiDescription": "A 1-2 sentence crisp, objective description of what's occurring, analyzing the uploaded photo if present.",
  "isSpam": true or false,
  "spamReasoning": "If isSpam is true, write a brief explanation (e.g., 'Not related to local issues or civic reporting, advertising link, or gibberish text')"
}

Do not include any Markdown wrapping or codeblocks. Ensure it is valid, parseable JSON.

Reporter's Description: "${description}"
`;

    let response;
    if (photoBase64) {
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = photoBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    }

    const resText = response.text || "";
    const cleanJsonText = resText.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const resultObj = JSON.parse(cleanJsonText);

    return {
      category: categories.includes(resultObj.category) ? resultObj.category : defaultRes.category,
      title: resultObj.title || defaultRes.title,
      aiDescription: resultObj.aiDescription || defaultRes.aiDescription,
      isSpam: !!resultObj.isSpam,
      spamReasoning: resultObj.spamReasoning || ""
    };
  } catch (err) {
    console.error("Error with Gemini classification:", err);
    return defaultRes;
  }
}

async function startServer() {
  const app = express();

  // Handle json payload up to 50mb for photo base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  // Auth: Email/Password or Create user
  app.post("/api/auth/login", (req, res) => {
    const { email, name, password, isAnonymous } = req.body;

    if (isAnonymous) {
      const anonId = "anon-" + Math.floor(1000 + Math.random() * 9000);
      const anonUser: User = {
        id: anonId,
        name: `Anonymous Citizen #${anonId.replace("anon-", "")}`,
        email: "anonymous@groundzero.in",
        trustScore: 40, // starts with a limited trust score
        isAnonymous: true,
      };
      activeUsers[anonId] = anonUser;
      return res.json({ success: true, user: anonUser });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Dynamic user lookup or registration
    const existingUser = Object.values(activeUsers).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.json({ success: true, user: existingUser });
    }

    // Register a new user on the fly
    const newId = "user-" + Math.random().toString(36).substring(2, 9);
    const cleanName = name || email.split("@")[0] || "Citizen";
    const newUser: User = {
      id: newId,
      name: cleanName,
      email: email.toLowerCase(),
      trustScore: 50,
    };
    activeUsers[newId] = newUser;
    return res.json({ success: true, user: newUser });
  });

  // Get active issues
  app.get("/api/issues", (req, res) => {
    // Re-verify and include reporter trust score dynamically
    const issuesWithTrust = activeIssues.map(issue => {
      const reporterTrust = activeUsers[issue.reporterId]?.trustScore ?? issue.reporterTrustScore;
      return {
        ...issue,
        reporterTrustScore: reporterTrust
      };
    });
    res.json(issuesWithTrust);
  });

  // Post new issue (with optional Gemini auto-classification + Vision + Spam check)
  app.post("/api/issues", async (req, res) => {
    try {
      const { description, category, photoUrl, lat, lng, reporterId, isAnonymous, useAI } = req.body;

      if (!description || !lat || !lng || !reporterId) {
        return res.status(400).json({ error: "Missing required fields (description, lat, lng, reporterId)" });
      }

      const reporter = activeUsers[reporterId] || { id: reporterId, name: "Anonymous Citizen", trustScore: 40 };

      let finalCategory = category || "drama";
      let finalTitle = description.substring(0, 35) + "...";
      let aiDescription = "AI verified local citizen report.";
      let isSpam = false;
      let spamReasoning = "";

      // Call AI to classify, analyze, do vision and spam checks
      console.log("Analyzing text / photo with Gemini...");
      const classification = await autoCategorizeWithAI(description, photoUrl);
      
      if (useAI) {
        finalCategory = classification.category;
        finalTitle = classification.title;
      } else {
        // Fallback or user chosen category
        finalCategory = category || classification.category;
        const words = description.split(" ");
        finalTitle = words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
      }

      aiDescription = classification.aiDescription;
      isSpam = classification.isSpam;
      spamReasoning = classification.spamReasoning;

      const areaName = getAreaFromCoords(lat, lng);
      const newIssue: Issue = {
        id: "issue-" + Math.random().toString(36).substring(2, 9),
        title: finalTitle,
        description,
        category: finalCategory as Category,
        status: "Reported",
        lat,
        lng,
        area: areaName,
        photoUrl, // Base64 representation
        reporterId: reporter.id,
        reporterName: (reporter as any).isAnonymous ? reporter.name : (activeUsers[reporterId]?.name || reporter.name),
        reporterTrustScore: reporter.trustScore,
        isAnonymous: !!isAnonymous,
        createdAt: new Date().toISOString(),
        reactions: { verified: 0, cap: 0, big_issue: 0, bruh: 0 },
        userReactions: {},
        aiDescription,
        isSpam,
        spamReasoning
      };

      activeIssues.unshift(newIssue);
      saveIssues(activeIssues);

      res.json({
        success: true,
        issue: newIssue,
        aiAnalysis: {
          suggestedCategory: classification.category,
          suggestedTitle: classification.title,
          aiDescription: classification.aiDescription,
          isSpam: classification.isSpam,
          spamReasoning: classification.spamReasoning
        }
      });
    } catch (err: any) {
      console.error("Error creating issue:", err);
      res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
  });

  // Reaction endpoint: Adds reaction, updates user trust score dynamically
  app.post("/api/issues/:id/react", (req, res) => {
    const { id } = req.params;
    const { userId, reactionType } = req.body; // reactionType: 'verified' | 'cap' | 'big_issue' | 'bruh'

    if (!userId || !reactionType) {
      return res.status(400).json({ error: "Missing userId or reactionType" });
    }

    const issue = activeIssues.find(i => i.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    if (!issue.userReactions) {
      issue.userReactions = {};
    }

    const previousReaction = issue.userReactions[userId];

    if (previousReaction === reactionType) {
      // Toggle off (remove reaction)
      delete issue.userReactions[userId];
      issue.reactions[previousReaction] = Math.max(0, (issue.reactions[previousReaction] || 0) - 1);
    } else {
      // Deduct previous reaction if any
      if (previousReaction) {
        issue.reactions[previousReaction] = Math.max(0, (issue.reactions[previousReaction] || 0) - 1);
      }
      // Add new reaction
      issue.userReactions[userId] = reactionType;
      issue.reactions[reactionType] = (issue.reactions[reactionType] || 0) + 1;
    }

    // Auto-escalation or status update logic based on reactions
    const vCount = issue.reactions.verified || 0;
    const cCount = issue.reactions.cap || 0;
    const bCount = issue.reactions.big_issue || 0;

    if (issue.status === "Reported" && vCount >= 5) {
      issue.status = "Verified";
    }
    if (issue.status === "Verified" && bCount >= 10) {
      issue.status = "Escalated";
    }
    // If community says it is high key Cap (fake), mark as Reported/demoted
    if (issue.status === "Verified" && cCount > vCount + 3) {
      issue.status = "Reported";
    }

    // Recalculate trust score of the post's reporter
    const reporterId = issue.reporterId;
    const newTrustScore = recalculateUserTrustScore(reporterId);

    // Save state
    saveIssues(activeIssues);

    res.json({
      success: true,
      issue,
      reporterTrustScore: newTrustScore
    });
  });

  // Status adjustment endpoint
  app.post("/api/issues/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Reported' | 'Verified' | 'Escalated' | 'Resolved'

    const issue = activeIssues.find(i => i.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    issue.status = status as Status;
    recalculateUserTrustScore(issue.reporterId);
    saveIssues(activeIssues);

    res.json({ success: true, issue });
  });

  // User details + trust score lookup
  app.get("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const user = activeUsers[id];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const currentTrust = recalculateUserTrustScore(id);
    res.json({
      ...user,
      trustScore: currentTrust
    });
  });

  // Dashboard analytics endpoint
  app.get("/api/dashboard/metrics", (req, res) => {
    const totalIssues = activeIssues.length;
    const resolvedCount = activeIssues.filter(i => i.status === "Resolved").length;
    const unresolvedCount = totalIssues - resolvedCount;

    const byCategory: Record<Category, number> = {
      "Civic Issue": 0,
      "Pothole": 0,
      "Flooding": 0,
      "Power Cut": 0,
      "Garbage": 0,
      "Corruption": 0,
      "Government Failure": 0,
      "Protest / Rally": 0,
      "Local Drama": 0,
      "Argument / Dispute": 0,
      "Harassment": 0,
      "Breaking News": 0,
      "Village Problem": 0,
      "Weather": 0,
      "War / Conflict": 0,
      "Other": 0
    };

    const byArea: Record<string, { resolved: number; unresolved: number }> = {};

    activeIssues.forEach(issue => {
      if (byCategory[issue.category] !== undefined) {
        byCategory[issue.category] += 1;
      } else {
        byCategory[issue.category] = 1;
      }

      if (!byArea[issue.area]) {
        byArea[issue.area] = { resolved: 0, unresolved: 0 };
      }

      if (issue.status === "Resolved") {
        byArea[issue.area].resolved += 1;
      } else {
        byArea[issue.area].unresolved += 1;
      }
    });

    res.json({
      totalIssues,
      resolvedCount,
      unresolvedCount,
      byCategory,
      byArea
    });
  });

  // Serve static assets + mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GroundZero Backend running on port ${PORT}`);
  });
}

startServer();
