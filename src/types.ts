/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category =
  | 'Civic Issue'
  | 'Pothole'
  | 'Flooding'
  | 'Power Cut'
  | 'Garbage'
  | 'Corruption'
  | 'Government Failure'
  | 'Protest / Rally'
  | 'Local Drama'
  | 'Argument / Dispute'
  | 'Harassment'
  | 'Breaking News'
  | 'Village Problem'
  | 'Weather'
  | 'War / Conflict'
  | 'Other';
export type Status = 'Reported' | 'Verified' | 'Escalated' | 'Resolved';
export type ReactionType = 'verified' | 'cap' | 'big_issue' | 'bruh';

export interface User {
  id: string;
  email: string;
  name: string;
  trustScore: number;
  isAnonymous?: boolean;
}

export interface Reactions {
  verified: number;
  cap: number;
  big_issue: number;
  bruh: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  lat: number;
  lng: number;
  area: string;
  photoUrl?: string; // Base64 or local URL
  reporterId: string;
  reporterName: string;
  reporterTrustScore: number;
  isAnonymous: boolean;
  createdAt: string; // ISO string
  reactions: Reactions;
  // Map of userId -> ReactionType
  userReactions?: Record<string, ReactionType>;
  // AI-generated fields
  aiDescription?: string; // Gemini Vision image analysis
  isSpam?: boolean; // Spam flag
  spamReasoning?: string;
}

export interface DashboardMetrics {
  totalIssues: number;
  resolvedCount: number;
  unresolvedCount: number;
  byCategory: Record<Category, number>;
  byArea: Record<string, { resolved: number; unresolved: number }>;
}
