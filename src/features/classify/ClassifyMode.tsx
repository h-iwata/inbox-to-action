import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Layers,
  PenTool,
  Sparkles,
  Trophy,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { categoryIcons } from '@/config/icons'
import { useResponsive } from '@/hooks/useResponsive'
import { useCommandHandler } from '@/lib/keybindings'
import { useTaskActions } from '@/store/tasksStore'
import { useUIActions } from '@/store/uiStore'
import { useInboxTasks, useTasksByCategory } from '@/store/useTasks'
import { ClassifyOverlay } from './ClassifyOverlay'
import {
  CATEGORY_BY_DIRECTION,
  type ClassifyCategory,
  type Direction,
  type DragDirection,
  detectDragDirection,
} from './classify-helpers'
import './ClassifyMode.css'

export const ClassifyMode: React.FC = () => {
  const inboxTasks = useInboxTasks()
  const { classifyTask } = useTaskActions()
  const { setMode } = useUIActions()
  const currentTask = inboxTasks[0]
  const { isMobile } = useResponsive()

  // カテゴリ別のタスク数を取得
  const workTasks = useTasksByCategory('work')
  const lifeTasks = useTasksByCategory('life')
  const studyTasks = useTasksByCategory('study')
  const hobbyTasks = useTasksByCategory('hobby')

  // 操作モード管理
  const [isOperating, setIsOperating] = useState(false)
  const [dragDirection, setDragDirection] = useState<DragDirection>(null)
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [centerPosition, setCenterPosition] = useState({ x: 0, y: 0 })
  const [containerBounds, setContainerBounds] = useState({ top: 0, bottom: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // アニメーション用の状態
  const [isClassifying, setIsClassifying] = useState(false)
  const [classifiedDirection, setClassifiedDirection] = useState<Direction | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const resetOperation = () => {
    setIsOperating(false)
    setDragDirection(null)
  }

  const handleClassify = (category: ClassifyCategory) => {
    if (!currentTask || isClassifying) return

    setIsClassifying(true)
    setClassifiedDirection(({ study: 'up', hobby: 'down', work: 'left', life: 'right' } as const)[category])
    setShowSuccess(true)

    // カードが飛んでいくアニメーション
    setTimeout(() => {
      classifyTask(currentTask.id, category)
      setShowSuccess(false)

      // 次のカードが現れるアニメーション
      setTimeout(() => {
        setIsClassifying(false)
        setClassifiedDirection(null)
        resetOperation()
      }, 100)
    }, 150)
  }

  // 操作開始（クリック/タップ）
  const handleOperationStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentTask || isOperating) return

    const isTouchEvent = 'touches' in e
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY

    setIsOperating(true)
    setCurrentPosition({ x: clientX, y: clientY })
    setDragDirection('center')
  }

  // キーボードショートカット（キーの割り当ては src/config/commands.ts）
  const classifyByCommand = (category: ClassifyCategory) => {
    if (!currentTask || isOperating) return
    handleClassify(category)
  }

  useCommandHandler('classify.work', () => classifyByCommand('work'))
  useCommandHandler('classify.life', () => classifyByCommand('life'))
  useCommandHandler('classify.study', () => classifyByCommand('study'))
  useCommandHandler('classify.hobby', () => classifyByCommand('hobby'))

  // モバイルでのプルダウン更新を防ぐ
  useEffect(() => {
    if (!isMobile) return

    const preventPullToRefresh = (e: TouchEvent) => e.preventDefault()
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false })

    return () => document.removeEventListener('touchmove', preventPullToRefresh)
  }, [isMobile])

  // タスクカードの中心位置とコンテナの境界を取得（リサイズ時に更新）
  useEffect(() => {
    const updatePositions = () => {
      const cardRect = cardRef.current?.getBoundingClientRect()
      if (cardRect) {
        setCenterPosition({ x: cardRect.left + cardRect.width / 2, y: cardRect.top + cardRect.height / 2 })
      }
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (containerRect) {
        setContainerBounds({ top: containerRect.top, bottom: containerRect.bottom })
      }
    }

    updatePositions()
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [])

  // グローバルイベントリスナー
  useEffect(() => {
    if (!isOperating) return

    const handleOperationMove = (e: MouseEvent | TouchEvent) => {
      // タッチイベントの場合、プルダウン更新を防ぐ
      if ('touches' in e) {
        e.preventDefault()
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      setCurrentPosition({ x: clientX, y: clientY })

      // キャンセルボタン中心からの変位で方向を判定する
      setDragDirection(detectDragDirection(clientX - centerPosition.x, clientY - centerPosition.y))
    }

    const handleOperationEnd = (e: MouseEvent | TouchEvent) => {
      e.stopPropagation()
      if (!dragDirection || dragDirection === 'center') {
        resetOperation()
        return
      }
      handleClassify(CATEGORY_BY_DIRECTION[dragDirection])
    }

    const handleTouchCancel = () => resetOperation()

    // マウスとタッチの両方のイベントを登録（タッチスクリーン対応PCなどのため）
    window.addEventListener('mousemove', handleOperationMove)
    window.addEventListener('mouseup', handleOperationEnd)
    window.addEventListener('touchmove', handleOperationMove, { passive: false })
    window.addEventListener('touchend', handleOperationEnd)
    window.addEventListener('touchcancel', handleTouchCancel)

    return () => {
      window.removeEventListener('mousemove', handleOperationMove)
      window.removeEventListener('mouseup', handleOperationEnd)
      window.removeEventListener('touchmove', handleOperationMove)
      window.removeEventListener('touchend', handleOperationEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [isOperating, dragDirection])

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">すべて分類完了！</h2>
          <p className="text-gray-400 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>一覧</span>
            </button>
            <span>を確認、または</span>
            <button
              type="button"
              onClick={() => setMode('create')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-colors"
            >
              <PenTool className="w-4 h-4" />
              <span>作成</span>
            </button>
          </p>
        </div>
      </div>
    )
  }

  // アニメーション用のクラスとスタイル
  const animationMap = {
    up: 'animate-fly-up',
    down: 'animate-fly-down',
    left: 'animate-fly-left',
    right: 'animate-fly-right',
  } as const

  const getClassifyAnimation = () => (classifiedDirection ? animationMap[classifiedDirection] : '')

  const getClassifyStyle = () => {
    if (!classifiedDirection) return {}
    return {
      zIndex: 100,
      position: 'relative' as const,
    }
  }

  return (
    <div
      className="max-w-5xl mx-auto flex flex-col"
      ref={containerRef}
      style={{
        height: 'calc(100svh - 220px)', // svhを使用してBraveの問題に対応
        // フォールバック: svh非対応ブラウザは自動的に100vhにフォールバック
      }}
    >
      {/* ヘッダー：残りタスク数とプレビュー */}
      <div className="mb-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            <span className="text-gray-300 font-semibold">Inbox</span>
            <span className="bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full text-sm font-bold">
              {inboxTasks.length}
            </span>
          </div>

          {/* 次のタスクのプレビュー（スタック表現） */}
          {inboxTasks.length > 1 && (
            <div className="text-xs text-gray-500">
              次: {inboxTasks[1].title.length > 20 ? `${inboxTasks[1].title.substring(0, 20)}...` : inboxTasks[1].title}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        {/* 操作オーバーレイ */}
        {isOperating && (
          <ClassifyOverlay
            dragDirection={dragDirection}
            centerPosition={centerPosition}
            currentPosition={currentPosition}
            containerBounds={containerBounds}
            isMobile={isMobile}
          />
        )}

        {/* カテゴリヒント（小さく表示） */}
        {!isOperating && (
          <>
            {/* 上下左右のカテゴリインジケーター */}
            <div
              className={`absolute ${isMobile ? 'top-2' : 'top-4'} left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-gray-500`}
            >
              <ChevronUp className="w-3 h-3 text-violet-400" />
              <span className="text-xs">{categoryIcons.study.label}</span>
            </div>
            <div
              className={`absolute ${isMobile ? 'bottom-2' : 'bottom-4'} left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-gray-500`}
            >
              <ChevronDown className="w-3 h-3 text-pink-400" />
              <span className="text-xs">{categoryIcons.hobby.label}</span>
            </div>
            <div
              className={`absolute ${isMobile ? 'left-2' : 'left-4'} top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500`}
            >
              <ChevronLeft className="w-3 h-3 text-sky-400" />
              <span className="text-xs">{categoryIcons.work.label}</span>
            </div>
            <div
              className={`absolute ${isMobile ? 'right-2' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500`}
            >
              <span className="text-xs">{categoryIcons.life.label}</span>
              <ChevronRight className="w-3 h-3 text-teal-400" />
            </div>
          </>
        )}

        {/* 中央のタスクカードスタック */}
        <div className={`relative ${!isClassifying && currentTask ? 'animate-slide-up-fade-in' : ''}`}>
          {/* 背後のカード（スタック表現） */}
          <div className="absolute inset-0 flex items-center justify-center">
            {inboxTasks.slice(1, Math.min(4, inboxTasks.length)).map((task, index) => (
              <div
                key={task.id}
                className="absolute bg-linear-to-br from-gray-700/50 to-gray-600/50 rounded-2xl border border-gray-600/30 shadow-lg"
                style={{
                  width: isMobile ? '180px' : '320px',
                  height: isMobile ? '100px' : '180px',
                  transform: `
                    translateY(${(index + 1) * 4}px) 
                    translateX(${(index + 1) * 2}px)
                    rotate(${index % 2 === 0 ? 1 : -1}deg)
                    scale(${1 - (index + 1) * 0.05})
                  `,
                  zIndex: -index - 1,
                  opacity: 0.3 - index * 0.1,
                }}
              />
            ))}
          </div>

          {/* メインのタスクカード */}
          <div
            ref={cardRef}
            className={`
              relative bg-linear-to-br from-violet-900/90 via-purple-800/90 to-indigo-900/90 
              backdrop-blur-sm rounded-2xl shadow-2xl
              ${isMobile ? 'p-5 w-55 min-h-30' : 'p-8 w-85 min-h-50'}
              border-2 border-violet-500/30
              ${isOperating ? 'scale-95 opacity-90' : 'hover:scale-105 hover:border-violet-400/50'}
              transition-all duration-75 cursor-pointer select-none
              flex items-center justify-center
              ${isClassifying ? getClassifyAnimation() : ''}
            `}
            style={isClassifying ? getClassifyStyle() : {}}
            onMouseDown={handleOperationStart}
            onTouchStart={handleOperationStart}
          >
            {/* カードデザイン */}
            <div className="absolute top-3 right-3">
              <Sparkles className="w-5 h-5 text-yellow-400/50 animate-pulse" />
            </div>
            <div className="absolute bottom-3 left-3">
              <div className="text-xs text-violet-300/50 font-mono">#{currentTask.id.slice(-4)}</div>
            </div>

            {/* タスク内容 */}
            <div className="text-center px-2 py-2 max-w-full overflow-hidden">
              <h3 className={`font-bold text-white ${isMobile ? 'text-sm' : 'text-lg'} leading-relaxed`}>
                <span className="block overflow-wrap-break-word">{currentTask.title}</span>
              </h3>
            </div>

            {/* ホバーエフェクト */}
            <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
      </div>

      {/* フッター: 分類統計 */}
      <div className="mt-2 px-4">
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            {React.createElement(categoryIcons.work.icon, {
              className: 'w-4 h-4 text-sky-400',
            })}
            <span className="text-gray-400">仕事</span>
            <span className="bg-sky-600/20 text-sky-400 px-1.5 py-0.5 rounded-full font-bold">{workTasks.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {React.createElement(categoryIcons.life.icon, {
              className: 'w-4 h-4 text-teal-400',
            })}
            <span className="text-gray-400">生活</span>
            <span className="bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded-full font-bold">
              {lifeTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {React.createElement(categoryIcons.study.icon, {
              className: 'w-4 h-4 text-violet-400',
            })}
            <span className="text-gray-400">学習</span>
            <span className="bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded-full font-bold">
              {studyTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {React.createElement(categoryIcons.hobby.icon, {
              className: 'w-4 h-4 text-pink-400',
            })}
            <span className="text-gray-400">趣味</span>
            <span className="bg-pink-600/20 text-pink-400 px-1.5 py-0.5 rounded-full font-bold">
              {hobbyTasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* 成功エフェクト */}
      {showSuccess && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* 中央のスパークル */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-success-bounce">
              <Sparkles className="w-20 h-20 text-yellow-400 drop-shadow-2xl" />
            </div>
          </div>

          {/* パーティクルエフェクト */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: 並び替えの起きない装飾用の固定長配列
                key={i}
                className="absolute animate-particle"
                style={{
                  animationDelay: `${i * 0.02}s`,
                  transform: `rotate(${i * 60}deg) translateY(-60px)`,
                }}
              >
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
