import type { ColorValue, OdorValue, PainValue, BadgeId } from "./enums";

// ---- Auth ----------------------------------------------------------------

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface SignupBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

// ---- Sessions --------------------------------------------------------------

// POST /api/sessions body — camelCase.
export interface SessionCreateBody {
  bristolType?: number | null;
  color?: ColorValue | "";
  odor?: OdorValue | "";
  pain?: PainValue | "";
  visibleFood?: boolean;
  bloodFlag?: boolean;
  symptoms?: string[];
  notes?: string;
  aiSuggested?: boolean;
  aiConfidence?: number | null;
  keepPhoto?: boolean;
  photoDataUrl?: string | null;
}

export interface SessionCreateResponse {
  session: { id: number; occurred_at: string };
  streak: StreakInfo;
  graceTokens: number;
  graceGranted: boolean;
  newlyUnlocked: BadgeSummary[];
}

// GET /api/sessions row shape — snake_case, straight from Postgres/SQLite.
export interface SessionRow {
  id: number;
  occurred_at: string;
  bristol_type: number | null;
  color: ColorValue | null;
  odor: OdorValue | null;
  pain: PainValue | null;
  visible_food: boolean;
  blood_flag: boolean;
  symptoms: string[];
  notes: string | null;
}

export interface SessionListResponse {
  sessions: SessionRow[];
}

// ---- Dashboard -------------------------------------------------------------

export interface StreakInfo {
  current: number;
  longest: number;
  tokensUsed: number;
}

export interface HeatmapDay {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface BadgeSummary {
  id: BadgeId | string;
  icon: string;
  name: string;
  desc: string;
}

export interface Badge extends BadgeSummary {
  unlocked: boolean;
}

export interface DashboardResponse {
  streak: StreakInfo;
  graceTokens: number;
  streakFreezeUntil: string | null;
  heatmap: HeatmapDay[];
  bristolCounts: number[]; // length 7
  badges: Badge[];
  totalSessions: number;
}

export interface FreezeResponse {
  streakFreezeUntil: string;
}

// ---- Circle ----------------------------------------------------------------

export interface LeaderboardEntry {
  username: string;
  streak: number;
  longest: number;
  consistency: number; // 0..1
  isMe: boolean;
  userId: number;
}

export interface CircleResponse {
  leaderboard: LeaderboardEntry[];
}

export interface FriendRequest {
  id: number; // the requesting user's id
  username: string;
}

export interface FriendRequestsResponse {
  requests: FriendRequest[];
}

// ---- Vision ------------------------------------------------------------------

export interface VisionWithheldResponse {
  withheld: true;
  confidence: number;
}

export interface VisionResultResponse {
  withheld: false;
  confidence: number;
  bristolTypeGuess: number | null;
  colorGuess: ColorValue | null;
  visibleFoodGuess: boolean | null;
  notes: string | null;
}

export type VisionResponse = VisionWithheldResponse | VisionResultResponse;

// ---- Errors ------------------------------------------------------------------

export interface ApiErrorBody {
  error: string;
}
