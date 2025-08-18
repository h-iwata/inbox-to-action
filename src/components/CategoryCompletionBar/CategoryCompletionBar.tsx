import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectTodayCompletedByCategory } from '../../store/slices/tasksSlice'
import { categoryIcons } from '../../config/icons'
import { BarChart3, Sparkles, Flame, Zap, Star } from 'lucide-react'

const messages = {
  balanced: [
    "バランス良く進んでいます！",
    "全方位型の充実した一日！",
    "理想的なバランスです！"
  ],
  workFocused: [
    "今日は仕事デー！集中できましたね",
    "仕事モード全開！",
    "ワーカホリックな一日でした"
  ],
  lifeFocused: [
    "生活を大切にする一日でした",
    "暮らしを整える時間が取れました",
    "生活リズムが整っています"
  ],
  studyFocused: [
    "学びの多い一日でした！",
    "知識欲が爆発中！",
    "成長を感じる一日です"
  ],
  hobbyFocused: [
    "趣味を楽しむ余裕がありました",
    "リフレッシュできた一日！",
    "楽しい時間を過ごせましたね"
  ],
  starting: [
    "今日も頑張りましょう！",
    "良いスタートです！",
    "これから加速していきましょう"
  ],
  productive: [
    "素晴らしい生産性です！",
    "タスクキラーと呼ばれそう！",
    "圧倒的な実行力！"
  ],
  superProductive: [
    "伝説的な一日です！🔥",
    "もはや神の領域...！",
    "タスクマスターの称号を授けます！"
  ]
}

export const CategoryCompletionBar: React.FC = () => {
  const completedByCategory = useSelector(selectTodayCompletedByCategory)
  
  const { total, percentages, maxCategory, message, level } = useMemo(() => {
    const total = Object.values(completedByCategory).reduce((sum, count) => sum + count, 0)
    
    // カテゴリごとの割合を計算
    const percentages = {
      work: total > 0 ? (completedByCategory.work / total) * 100 : 0,
      life: total > 0 ? (completedByCategory.life / total) * 100 : 0,
      study: total > 0 ? (completedByCategory.study / total) * 100 : 0,
      hobby: total > 0 ? (completedByCategory.hobby / total) * 100 : 0
    }
    
    // 最も多いカテゴリを特定
    const maxCategory = Object.entries(completedByCategory).reduce((max, [cat, count]) => 
      count > completedByCategory[max as keyof typeof completedByCategory] ? cat : max
    , 'work')
    
    // メッセージを選択
    let messageType: keyof typeof messages
    if (total === 0) {
      messageType = 'starting'
    } else if (total >= 20) {
      messageType = 'superProductive'
    } else if (total >= 10) {
      messageType = 'productive'
    } else if (Math.max(...Object.values(percentages)) < 40) {
      messageType = 'balanced'
    } else {
      messageType = `${maxCategory}Focused` as keyof typeof messages
    }
    
    const messageList = messages[messageType]
    const message = messageList[Math.floor(Math.random() * messageList.length)]
    
    // レベルを計算（0-30の範囲を0-5にマッピング）
    const level = Math.min(5, Math.floor(total / 6))
    
    return { total, percentages, maxCategory, message, level }
  }, [completedByCategory])

  // レベルに応じたスタイルを取得
  const getBarStyles = () => {
    const baseClasses = "relative overflow-hidden rounded-full transition-all duration-500"
    const heightClasses = [
      "h-2", // level 0: 0-5個
      "h-2.5", // level 1: 6-11個
      "h-3", // level 2: 12-17個
      "h-3.5", // level 3: 18-23個
      "h-4", // level 4: 24-29個
      "h-5" // level 5: 30個以上
    ]
    const shadowClasses = [
      "",
      "shadow-sm",
      "shadow-md shadow-blue-500/20",
      "shadow-lg shadow-purple-500/30",
      "shadow-xl shadow-orange-500/40",
      "shadow-2xl shadow-red-500/50"
    ]
    const animationClasses = [
      "",
      "",
      "animate-pulse-slow",
      "animate-pulse",
      "animate-pulse-fast",
      "animate-glow"
    ]
    
    return `${baseClasses} ${heightClasses[level]} ${shadowClasses[level]} ${animationClasses[level]}`
  }

  // カテゴリの色を取得
  const categoryColors = {
    work: 'from-sky-500 to-sky-600',
    life: 'from-teal-500 to-teal-600',
    study: 'from-violet-500 to-violet-600',
    hobby: 'from-pink-500 to-pink-600'
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-100">今日の成果</h3>
        </div>
        {total > 0 && (
          <div className="text-sm text-gray-400">
            計 {total} タスク完了
          </div>
        )}
      </div>

      {/* グラデーションバー */}
      <div className="relative">
        {/* レベル3以上でパーティクルエフェクト */}
        {level >= 3 && (
          <div className="absolute -top-3 w-full flex justify-around items-center">
            {level === 3 && (
              <>
                <Sparkles className="w-3 h-3 text-blue-400 animate-twinkle" />
                <Sparkles className="w-3 h-3 text-purple-400 animate-twinkle-delay" />
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
        <div className={getBarStyles()}>
          {total > 0 ? (
            <div className="flex h-full">
              {percentages.work > 0 && (
                <div 
                  className={`bg-gradient-to-r ${categoryColors.work} transition-all duration-500`}
                  style={{ width: `${percentages.work}%` }}
                />
              )}
              {percentages.life > 0 && (
                <div 
                  className={`bg-gradient-to-r ${categoryColors.life} transition-all duration-500`}
                  style={{ width: `${percentages.life}%` }}
                />
              )}
              {percentages.study > 0 && (
                <div 
                  className={`bg-gradient-to-r ${categoryColors.study} transition-all duration-500`}
                  style={{ width: `${percentages.study}%` }}
                />
              )}
              {percentages.hobby > 0 && (
                <div 
                  className={`bg-gradient-to-r ${categoryColors.hobby} transition-all duration-500`}
                  style={{ width: `${percentages.hobby}%` }}
                />
              )}
              
              {/* レベル4以上で流れるエフェクト */}
              {level >= 4 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
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
                <Icon className={`w-3 h-3 ${isMax ? 'text-' + category + '-400' : ''}`} />
                <span>{categoryIcons[category].label}</span>
                {count > 0 && (
                  <span className={`${isMax ? 'text-white' : 'text-gray-600'}`}>
                    ({count})
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* メッセージ */}
      <div className={`text-center text-sm ${
        level >= 4 ? 'text-orange-400 font-bold animate-pulse' :
        level >= 2 ? 'text-blue-400 font-medium' :
        'text-gray-400'
      }`}>
        {level >= 3 && '🎯 '}
        {message}
        {level >= 5 && ' 🔥'}
      </div>

      {/* カスタムアニメーション */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes twinkle-delay {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.8; transform: translateY(0); }
          25% { opacity: 1; transform: translateY(-2px); }
          75% { opacity: 0.6; transform: translateY(1px); }
        }
        @keyframes flicker-delay {
          0%, 100% { opacity: 0.6; transform: translateY(0); }
          25% { opacity: 0.8; transform: translateY(1px); }
          75% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-delay {
          from { transform: rotate(180deg); }
          to { transform: rotate(540deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes pulse-fast {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.1); }
        }
        @keyframes glow {
          0%, 100% { 
            transform: scaleY(1);
            filter: brightness(1);
          }
          50% { 
            transform: scaleY(1.15);
            filter: brightness(1.2);
          }
        }
        @keyframes bounce-delay {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-twinkle-delay {
          animation: twinkle-delay 2s ease-in-out infinite 0.5s;
        }
        .animate-flicker {
          animation: flicker 1.5s ease-in-out infinite;
        }
        .animate-flicker-delay {
          animation: flicker-delay 1.5s ease-in-out infinite 0.3s;
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .animate-spin-slow-delay {
          animation: spin-slow-delay 4s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 1.5s ease-in-out infinite;
        }
        .animate-bounce-delay {
          animation: bounce-delay 1s ease-in-out infinite 0.2s;
        }
      `}</style>
    </div>
  )
}