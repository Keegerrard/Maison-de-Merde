// The ONLY file in this codebase permitted to import from lucide-react.
// Enforces the hairline stroke weight the high-end-visual-design skill
// requires — nothing in this app ever renders Lucide's default 2px stroke.
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Check,
  X,
  Plus,
  Minus,
  Menu,
  Flame,
  Snowflake,
  Users,
  UserPlus,
  Award,
  FileText,
  Download,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  Droplet,
  Circle,
  CircleDot,
  Clock,
  Calendar,
  TrendingUp,
  Lock,
  Crown,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkle,
  MessageCircle,
  Bell,
  Share2,
  Send,
  Globe,
  User,
  Printer,
  Eye,
  EyeOff,
  ArrowLeft,
  Pencil,
  BadgeCheck,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Check,
  X,
  Plus,
  Minus,
  Menu,
  Flame,
  Snowflake,
  Users,
  UserPlus,
  Award,
  FileText,
  Download,
  Camera,
  Image: ImageIcon,
  AlertTriangle,
  Droplet,
  Circle,
  CircleDot,
  Clock,
  Calendar,
  TrendingUp,
  Lock,
  Crown,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkle,
  MessageCircle,
  Bell,
  Share2,
  Send,
  Globe,
  User,
  Printer,
  Eye,
  EyeOff,
  ArrowLeft,
  Pencil,
  BadgeCheck,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, "size" | "strokeWidth"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function Icon({
  name,
  size = 18,
  strokeWidth,
  label,
  className = "",
  ...rest
}: IconProps) {
  const Component = ICONS[name];
  const resolvedStroke =
    strokeWidth ?? (size >= 32 ? 1 : 1.25);
  const capped = Math.min(resolvedStroke, 1.5);

  const a11yProps = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <Component
      size={size}
      strokeWidth={capped}
      className={className}
      {...a11yProps}
      {...rest}
    />
  );
}
