import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectTodayCompletedByCategory } from '../../store/slices/tasksSlice'
import { categoryIcons } from '../../config/icons'
import { BarChart3, Sparkles, Flame, Zap, Star } from 'lucide-react'

const messages = {
  balanced: [
    "バランス良く進んでいます！",
    "全方位型の充実した一日！",
    "理想的なバランスです！",
    "マルチタスカーの鑑！",
    "オールラウンダーとして完璧です",
    "見事な配分センス！",
    "あらゆる面で成長中",
    "バランス型の勇者現る！",
    "人生の達人モード発動中",
    "調和の取れた最高の一日"
  ],
  workFocused: [
    "今日は仕事デー！集中できましたね",
    "仕事モード全開！",
    "ワーカホリックな一日でした",
    "プロフェッショナルの本領発揮！",
    "ビジネス戦士として君臨中",
    "仕事の鬼と化しています",
    "キャリアが輝いている！",
    "ワークマスターの称号GET！",
    "社会に貢献する戦士",
    "仕事スキルが急上昇中↑"
  ],
  lifeFocused: [
    "生活を大切にする一日でした",
    "暮らしを整える時間が取れました",
    "生活リズムが整っています",
    "ライフハッカーの極み！",
    "日常クエストを攻略中",
    "生活力がレベルアップ！",
    "暮らしの魔術師",
    "ホームマスター認定！",
    "QOLがグングン上昇中",
    "人生の基盤を強化完了"
  ],
  studyFocused: [
    "学びの多い一日でした！",
    "知識欲が爆発中！",
    "成長を感じる一日です",
    "知識の泉から力を得た！",
    "学習の扉が開かれた",
    "賢者への道を歩んでいる",
    "INT値が急上昇中！",
    "スキルツリーが拡張中",
    "経験値を大量獲得！",
    "ナレッジファイター覚醒"
  ],
  hobbyFocused: [
    "趣味を楽しむ余裕がありました",
    "リフレッシュできた一日！",
    "楽しい時間を過ごせましたね",
    "エンジョイモード全開！",
    "人生を謳歌している",
    "趣味スキルがMAXに！",
    "ハッピーゲージ満タン",
    "楽しさの錬金術師",
    "リラックスマスター認定",
    "充実度200%達成！"
  ],
  starting: [
    "今日も頑張りましょう！",
    "良いスタートです！",
    "これから加速していきましょう",
    "冒険の始まりだ！",
    "レベル1からの挑戦開始",
    "チュートリアル完了！本番へ",
    "エンジン始動！準備OK",
    "スタートダッシュ決めよう",
    "今日という名のゲーム開始",
    "さあ、伝説を作ろう"
  ],
  productive: [
    "素晴らしい生産性です！",
    "タスクキラーと呼ばれそう！",
    "圧倒的な実行力！",
    "コンボが決まってる！",
    "連続クリア記録更新中",
    "効率の鬼と化している",
    "タスクブレイカー発動！",
    "生産性モンスター覚醒",
    "実行力のエリート認定",
    "パフォーマンスが神レベル"
  ],
  superProductive: [
    "伝説的な一日です！🔥",
    "もはや神の領域...！",
    "タスクマスターの称号を授けます！",
    "完全にゾーンに入った！",
    "限界突破！オーバードライブ！",
    "レジェンドランク到達！",
    "タスク界の覇者降臨",
    "究極の生産性を解放",
    "SSRランクの実行力",
    "歴史に名を刻む一日"
  ]
}

export const CategoryCompletionBar: React.FC = () => {
  const completedByCategory = useSelector(selectTodayCompletedByCategory)
  
  const { total, percentages, maxCategory, message, level, nextLevelRequirement } = useMemo(() => {
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
    } else if (total >= 12) {
      messageType = 'superProductive'
    } else if (total >= 6) {
      messageType = 'productive'
    } else if (Math.max(...Object.values(percentages)) < 40) {
      messageType = 'balanced'
    } else {
      messageType = `${maxCategory}Focused` as keyof typeof messages
    }
    
    const messageList = messages[messageType]
    const message = messageList[Math.floor(Math.random() * messageList.length)]
    
    // レベルを計算（0-15の範囲を0-5にマッピング、各レベル3タスク）
    const level = Math.min(5, Math.floor(total / 3))
    
    // 次のレベルまでの必要タスク数を計算
    const nextLevelThreshold = level < 5 ? (level + 1) * 3 : 15
    const nextLevelRequirement = level < 5 ? nextLevelThreshold - total : 0
    
    return { total, percentages, maxCategory, message, level, nextLevelRequirement }
  }, [completedByCategory])

  // レベルに応じたスタイルを取得
  const getBarStyles = () => {
    const baseClasses = "relative overflow-hidden rounded-full transition-all duration-500"
    const heightClasses = [
      "h-2", // level 0: 0-2個
      "h-2.5", // level 1: 3-5個
      "h-3", // level 2: 6-8個
      "h-3.5", // level 3: 9-11個
      "h-4", // level 4: 12-14個
      "h-5" // level 5: 15個以上
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

  // カテゴリアイコンの色（Tailwindのパージングのため事前定義）
  const categoryIconColors = {
    work: 'text-sky-400',
    life: 'text-teal-400',
    study: 'text-violet-400',
    hobby: 'text-pink-400'
  }

  return (
    <div className="space-y-2.5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
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
              key={i} 
              className={`w-3.5 h-3.5 ${
                i < level
                  ? level >= 4 ? 'text-yellow-400 fill-current' : 
                    level >= 2 ? 'text-blue-400 fill-current' : 
                    'text-gray-400 fill-current'
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
                <Icon className={`w-3 h-3 ${isMax ? categoryIconColors[category] : ''}`} />
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
      <div className={`text-center text-sm mt-3 -mb-1 ${
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