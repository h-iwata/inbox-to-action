import {
  Briefcase,
  Home,
  BookOpen,
  Gamepad2,
  Inbox,
  Plus,
  Target,
  CheckCircle2,
  List,
  PenTool,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Hand,
  X,
  Flame,
  Pause,
  CheckSquare,
  Sparkles,
  Info,
  Clock,
  TrendingUp,
  Calendar,
  Activity,
  Archive,
  Trash2,
  GripVertical,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  MousePointer,
  Keyboard,
  Smartphone,
  Monitor,
  Move,
  Lightbulb,
  Trophy,
  Star,
  Zap,
  Timer,
  FolderOpen,
  FileText,
  PlayCircle,
  FastForward,
  RotateCcw,
  type LucideIcon
} from 'lucide-react'

export interface IconConfig {
  icon: LucideIcon
  color: string
  gradient: string
  label: string
}

export const categoryIcons: Record<string, IconConfig> = {
  work: {
    icon: Briefcase,
    color: 'text-sky-400',
    gradient: 'from-sky-600 to-sky-700',
    label: '仕事'
  },
  life: {
    icon: Home,
    color: 'text-teal-400',
    gradient: 'from-teal-600 to-teal-700',
    label: '生活'
  },
  study: {
    icon: BookOpen,
    color: 'text-violet-400',
    gradient: 'from-violet-600 to-violet-700',
    label: '学習'
  },
  hobby: {
    icon: Gamepad2,
    color: 'text-pink-400',
    gradient: 'from-pink-600 to-pink-700',
    label: '趣味'
  },
  inbox: {
    icon: Inbox,
    color: 'text-gray-400',
    gradient: 'from-gray-600 to-gray-700',
    label: 'インボックス'
  }
}

export const modeIcons: Record<string, LucideIcon> = {
  create: PenTool,
  classify: List,
  list: BarChart3,
  execute: CheckCircle2
}

export const actionIcons = {
  add: Plus,
  complete: CheckSquare,
  delete: Trash2,
  cancel: X,
  drag: GripVertical,
  pause: Pause,
  play: PlayCircle,
  executing: Flame,
  info: Info,
  help: Lightbulb,
  target: Target,
  sparkle: Sparkles,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  timer: Timer,
  clock: Clock,
  calendar: Calendar,
  activity: Activity,
  trendingUp: TrendingUp,
  archive: Archive,
  alert: AlertCircle,
  pointer: MousePointer,
  keyboard: Keyboard,
  smartphone: Smartphone,
  monitor: Monitor,
  move: Move,
  hand: Hand,
  reset: RotateCcw,
  forward: FastForward,
  folder: FolderOpen,
  file: FileText
}

export const navigationIcons = {
  left: ChevronLeft,
  right: ChevronRight,
  up: ChevronUp,
  down: ChevronDown
}

// Helper component for rendering icons with consistent styling
export const CategoryIcon: React.FC<{
  category: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}> = ({ category, size = 'md', className = '' }) => {
  const config = categoryIcons[category]
  if (!config) return null
  
  const Icon = config.icon
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }
  
  return <Icon className={`${sizeClasses[size]} ${config.color} ${className}`} />
}