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
  remember?: boolean;
}

export interface ChangeUsernameBody {
  newUsername: string;
  password: string;
}

export interface ChangeUsernameResponse {
  id: number;
  username: string;
}

export interface ForgotPasswordResponse {
  ok: true;
  delivered: boolean;
  demoNote?: string;
  resetToken?: string;
  username?: string;
  expiresAt?: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
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

// ---- Session detail / sharing ----------------------------------------------

export interface SessionDetail {
  id: number;
  user_id: number;
  occurred_at: string;
  bristol_type: number | null;
  color: ColorValue | null;
  odor: OdorValue | null;
  pain: PainValue | null;
  visibleFood: boolean;
  bloodFlag: boolean;
  symptoms: string[];
  notes: string | null;
  aiSuggested: boolean;
  ai_confidence: number | null;
  photo_kept: string | null;
}

export interface SessionDetailResponse {
  session: SessionDetail;
  isOwner: boolean;
  caption: string | null;
  sharedByUsername?: string | null;
}

export interface SharedSessionRow extends SessionDetail {
  shared_by_username: string;
  shared_at: string;
  caption?: string | null;
}

export interface SharedSessionsResponse {
  sessions: SharedSessionRow[];
}

export interface ShareSessionBody {
  username: string;
  caption?: string;
  includePhoto?: boolean;
}

// ---- Chat --------------------------------------------------------------------

export interface ChatMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  created_at: string;
  isMine: boolean;
}

export interface ChatThreadResponse {
  username: string;
  messages: ChatMessage[];
}

// ---- Notifications -------------------------------------------------------------

export type NotificationType =
  | "friend_request"
  | "friend_accept"
  | "message"
  | "session_shared";

export interface NotificationItem {
  id: number;
  type: NotificationType;
  payload: Record<string, unknown>;
  created_at: string;
  read: boolean;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

// ---- Profile -------------------------------------------------------------------

export type BannerId = "sage" | "claret" | "ink" | "gold" | "rose" | "slate";

export interface ProfileBadge {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface ProfileStats {
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  badgesUnlocked: number;
  badgesTotal: number;
}

export interface MyProfileResponse {
  username: string;
  nickname: string | null;
  banner: BannerId;
  traitBadgeId: string | null;
  trait: ProfileBadge | null;
  isPublic: boolean;
  joinedAt: string;
  stats: ProfileStats;
  unlockedBadges: ProfileBadge[];
}

export interface ProfileUpdateBody {
  nickname?: string;
  banner?: BannerId;
  traitBadgeId?: string | null;
  isPublic?: boolean;
}

export interface PublicProfileResponse {
  username: string;
  nickname: string | null;
  banner: BannerId;
  trait: ProfileBadge | null;
  joinedAt: string;
  stats: ProfileStats;
}

// ---- Errors ------------------------------------------------------------------

export interface ApiErrorBody {
  error: string;
}
