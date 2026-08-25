import { BarChart3, Flame, Sparkles, Star, Zap } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { categoryIcons } from '@/config/icons'
import { useTodayCompletedByCategory } from '@/store/useTasks'
import { trackLevelUp } from '@/utils/analytics'
import { barStyleClasses, summarizeCompletion } from './completion-helpers'
import './CategoryCompletionBar.css'

export const CategoryCompletionBar: React.FC = () => {
  const completedByCategory = useTodayCompletedByCategory()
  const prevLevelRef = useRef<number | null>(null)

  const { total, percentages, maxCategory, message, level, nextLevelRequirement } = useMemo(
    () => summarizeCompletion(completedByCategory),
    [completedByCategory]
  )

  // レベルアップを検知してトラッキング
  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      // レベルアップした場合
      trackLevelUp(level)
    }
    prevLevelRef.current = level
  }, [level])

  // カテゴリの色を取得
  const categoryColors = {
    work: 'from-sky-500 to-sky-600',
    life: 'from-teal-500 to-teal-600',
    study: 'from-violet-500 to-violet-600',
    hobby: 'from-pink-500 to-pink-600',
  }

  // カテゴリアイコンの色（Tailwindのパージングのため事前定義）
  const categoryIconColors = {
    work: 'text-sky-400',
    life: 'text-teal-400',
    study: 'text-violet-400',
    hobby: 'text-pink-400',
  }

  return (
    <div className="space-y-2.5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100">
              レベル {level}
              {level === 5 && <span className="ml-1 text-xs text-yellow-400">MAX!</span>}
            </h3>
            <p className="text-xs text-gray-500">
              {total}タスク完了
              {level < 5 && <span className="ml-1">（次まであと{nextLevelRequirement}）</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              // biome-ignore lint/suspicious/noArrayIndexKey: 並び替えの起きない装飾用の固定長配列
              key={i}
              className={`w-3.5 h-3.5 ${
                i < level
                  ? level >= 4
                    ? 'text-yellow-400 fill-current'
                    : level >= 2
                      ? 'text-blue-400 fill-current'
                      : 'text-gray-400 fill-current'
                  : 'text-gray-600'
              }`}
              fill={i < level ? 'currentColor' : 'none'}
              strokeWidth={i < level ? 0 : 1.5}
            />
          ))}
        </div>
      </div>

      {/* グラデーションバー */}
      <div className="relative mt-2">
        {/* レベル3以上でパーティクルエフェクト */}
        {level >= 3 && (
          <div className="absolute -top-3 w-full flex justify-around items-center">
            {level === 3 && (
              <>
                <Sparkles className="w-3 h-3 text-cyan-400 animate-twinkle" />
                <Star className="w-3 h-3 text-blue-500 animate-pulse" />
                <Sparkles className="w-3 h-3 text-violet-400 animate-twinkle-delay" />
              </>
            )}
            {level === 4 && (
              <>
                <Zap className="w-3 h-3 text-yellow-400 animate-bounce" />
                <Sparkles className="w-4 h-4 text-orange-400 animate-twinkle" />
                <Zap className="w-3 h-3 text-yellow-400 animate-bounce-delay" />
              </>
            )}
            {level === 5 && (
              <>
                <Flame className="w-4 h-4 text-red-400 animate-flicker" />
                <Star className="w-4 h-4 text-yellow-400 animate-spin-slow" />
                <Flame className="w-4 h-4 text-orange-400 animate-flicker-delay" />
                <Star className="w-4 h-4 text-yellow-400 animate-spin-slow-delay" />
                <Flame className="w-4 h-4 text-red-400 animate-flicker" />
              </>
            )}
          </div>
        )}

        {/* バー本体 */}
        <div className={barStyleClasses(level)}>
          {total > 0 ? (
            <div className="flex h-full">
              {percentages.work > 0 && (
                <div
                  className={`bg-linear-to-r ${categoryColors.work} transition-all duration-500`}
                  style={{ width: `${percentages.work}%` }}
                />
              )}
              {percentages.life > 0 && (
                <div
                  className={`bg-linear-to-r ${categoryColors.life} transition-all duration-500`}
                  style={{ width: `${percentages.life}%` }}
                />
              )}
              {percentages.study > 0 && (
                <div
                  className={`bg-linear-to-r ${categoryColors.study} transition-all duration-500`}
                  style={{ width: `${percentages.study}%` }}
                />
              )}
              {percentages.hobby > 0 && (
                <div
                  className={`bg-linear-to-r ${categoryColors.hobby} transition-all duration-500`}
                  style={{ width: `${percentages.hobby}%` }}
                />
              )}

              {/* レベル4以上で流れるエフェクト */}
              {level >= 4 && (
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
            </div>
          ) : (
            <div className="bg-gray-700/50 h-full" />
          )}
        </div>

        {/* カテゴリラベル */}
        <div className="flex justify-between mt-2 text-xs">
          {(['work', 'life', 'study', 'hobby'] as const).map(category => {
            const Icon = categoryIcons[category].icon
            const count = completedByCategory[category]
            const isMax = total > 0 && category === maxCategory && count > 0

            return (
              <div
                key={category}
                className={`flex items-center gap-1 transition-all ${
                  isMax ? 'text-white font-bold scale-110' : 'text-gray-500'
                }`}
              >
                <Icon className={`w-3 h-3 ${isMax ? categoryIconColors[category] : ''}`} />
                <span>{categoryIcons[category].label}</span>
                {count > 0 && <span className={`${isMax ? 'text-white' : 'text-gray-600'}`}>({count})</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* メッセージ */}
      <div
        className={`text-center text-sm mt-3 -mb-1 ${
          level >= 4
            ? 'text-orange-400 font-bold animate-pulse'
            : level >= 2
              ? 'text-blue-400 font-medium'
              : 'text-gray-400'
        }`}
      >
        {level >= 3 && '🎯 '}
        {message}
        {level >= 5 && ' 🔥'}
      </div>
    </div>
  )
}
