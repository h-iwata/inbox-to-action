import type { CategoryRecord, ListCategory } from '@/store/taskSelectors'

/** 1レベル上がるのに必要な完了数。 */
const TASKS_PER_LEVEL = 3

/** 到達できる最大レベル。 */
const MAX_LEVEL = 5

/** ひとつのカテゴリに偏っていると判断する割合（%）。 */
const FOCUS_THRESHOLD_PERCENT = 40

const messages = {
  balanced: [
    'バランス良く進んでいます！',
    '全方位型の充実した一日！',
    '理想的なバランスです！',
    'マルチタスカーの鑑！',
    'オールラウンダーとして完璧です',
    '見事な配分センス！',
    'あらゆる面で成長中',
    'バランス型の勇者現る！',
    '人生の達人モード発動中',
    '調和の取れた最高の一日',
  ],
  workFocused: [
    '今日は仕事デー！集中できましたね',
    '仕事モード全開！',
    'ワーカホリックな一日でした',
    'プロフェッショナルの本領発揮！',
    'ビジネス戦士として君臨中',
    '仕事の鬼と化しています',
    'キャリアが輝いている！',
    'ワークマスターの称号GET！',
    '社会に貢献する戦士',
    '仕事スキルが急上昇中↑',
  ],
  lifeFocused: [
    '生活を大切にする一日でした',
    '暮らしを整える時間が取れました',
    '生活リズムが整っています',
    'ライフハッカーの極み！',
    '日常クエストを攻略中',
    '生活力がレベルアップ！',
    '暮らしの魔術師',
    'ホームマスター認定！',
    'QOLがグングン上昇中',
    '人生の基盤を強化完了',
  ],
  studyFocused: [
    '学びの多い一日でした！',
    '知識欲が爆発中！',
    '成長を感じる一日です',
    '知識の泉から力を得た！',
    '学習の扉が開かれた',
    '賢者への道を歩んでいる',
    'INT値が急上昇中！',
    'スキルツリーが拡張中',
    '経験値を大量獲得！',
    'ナレッジファイター覚醒',
  ],
  hobbyFocused: [
    '趣味を楽しむ余裕がありました',
    'リフレッシュできた一日！',
    '楽しい時間を過ごせましたね',
    'エンジョイモード全開！',
    '人生を謳歌している',
    '趣味スキルがMAXに！',
    'ハッピーゲージ満タン',
    '楽しさの錬金術師',
    'リラックスマスター認定',
    '充実度200%達成！',
  ],
  starting: [
    '今日も頑張りましょう！',
    '良いスタートです！',
    'これから加速していきましょう',
    '冒険の始まりだ！',
    'レベル1からの挑戦開始',
    'チュートリアル完了！本番へ',
    'エンジン始動！準備OK',
    'スタートダッシュ決めよう',
    '今日という名のゲーム開始',
    'さあ、伝説を作ろう',
  ],
  productive: [
    '素晴らしい生産性です！',
    'タスクキラーと呼ばれそう！',
    '圧倒的な実行力！',
    'コンボが決まってる！',
    '連続クリア記録更新中',
    '効率の鬼と化している',
    'タスクブレイカー発動！',
    '生産性モンスター覚醒',
    '実行力のエリート認定',
    'パフォーマンスが神レベル',
  ],
  superProductive: [
    '伝説的な一日です！🔥',
    'もはや神の領域...！',
    'タスクマスターの称号を授けます！',
    '完全にゾーンに入った！',
    '限界突破！オーバードライブ！',
    'レジェンドランク到達！',
    'タスク界の覇者降臨',
    '究極の生産性を解放',
    'SSRランクの実行力',
    '歴史に名を刻む一日',
  ],
}

export interface CompletionSummary {
  /** 今日の完了数の合計。 */
  total: number
  /** カテゴリごとの割合（%）。 */
  percentages: CategoryRecord<number>
  /** 最も完了数が多いカテゴリ。 */
  maxCategory: ListCategory
  /** 表示する応援メッセージ。 */
  message: string
  /** 現在のレベル（0〜5）。 */
  level: number
  /** 次のレベルまでに必要な完了数。最大レベルなら 0。 */
  nextLevelRequirement: number
}

/** 完了数の内訳から、表示に必要な値をまとめて算出する。 */
export const summarizeCompletion = (completedByCategory: CategoryRecord<number>): CompletionSummary => {
  const total = Object.values(completedByCategory).reduce((sum, count) => sum + count, 0)

  const toPercent = (count: number) => (total > 0 ? (count / total) * 100 : 0)
  const percentages: CategoryRecord<number> = {
    work: toPercent(completedByCategory.work),
    life: toPercent(completedByCategory.life),
    study: toPercent(completedByCategory.study),
    hobby: toPercent(completedByCategory.hobby),
  }

  const maxCategory = Object.entries(completedByCategory).reduce(
    (max, [category, count]) => (count > completedByCategory[max] ? (category as ListCategory) : max),
    'work' as ListCategory
  )

  const messageType = selectMessageType(total, percentages, maxCategory)
  const messageList = messages[messageType]
  // total を種にして決定的に選ぶ（再レンダリングで文言が踊らないようにする）
  const message = messageList[total % messageList.length]

  const level = Math.min(MAX_LEVEL, Math.floor(total / TASKS_PER_LEVEL))
  const nextLevelRequirement = level < MAX_LEVEL ? (level + 1) * TASKS_PER_LEVEL - total : 0

  return { total, percentages, maxCategory, message, level, nextLevelRequirement }
}

const selectMessageType = (
  total: number,
  percentages: CategoryRecord<number>,
  maxCategory: ListCategory
): keyof typeof messages => {
  if (total === 0) return 'starting'
  if (total >= 12) return 'superProductive'
  if (total >= 6) return 'productive'
  if (Math.max(...Object.values(percentages)) < FOCUS_THRESHOLD_PERCENT) return 'balanced'
  return `${maxCategory}Focused` as keyof typeof messages
}

/** レベルに応じたバーの見た目（高さ・影・アニメーション）。 */
export const barStyleClasses = (level: number): string => {
  const base = 'relative overflow-hidden rounded-full transition-all duration-500'
  const heights = ['h-2', 'h-2.5', 'h-3', 'h-3.5', 'h-4', 'h-5']
  const shadows = [
    '',
    'shadow-sm',
    'shadow-md shadow-blue-500/20',
    'shadow-lg shadow-purple-500/30',
    'shadow-xl shadow-orange-500/40',
    'shadow-2xl shadow-red-500/50',
  ]
  const animations = ['', '', 'animate-pulse-slow', 'animate-pulse', 'animate-pulse-fast', 'animate-glow']

  return `${base} ${heights[level]} ${shadows[level]} ${animations[level]}`
}
