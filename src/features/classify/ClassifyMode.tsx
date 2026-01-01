import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { classifyTask, selectInboxTasks, selectTasksByCategory } from '../../store/slices/tasksSlice'
import { setMode } from '../../store/slices/uiSlice'
import { selectKeyBindings, isKeyPressed } from '../../store/slices/keyBindingsSlice'
import { useResponsive } from '../../hooks/useResponsive'
import { categoryIcons, actionIcons } from '../../config/icons'
import {
  Trophy,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PenTool,
  BarChart3,
} from 'lucide-react'
import type { Category } from '../../types'
import './ClassifyMode.css'

type Direction = 'up' | 'down' | 'left' | 'right'
type DragDirection = Direction | 'center' | null
type ClassifyCategory = Exclude<Category, 'inbox'>

export const ClassifyMode: React.FC = () => {
  const dispatch = useDispatch()
  const inboxTasks = useSelector(selectInboxTasks)
  const currentTask = inboxTasks[0]
  const { isMobile } = useResponsive()
  const keyBindings = useSelector(selectKeyBindings)

  // カテゴリ別のタスク数を取得
  const workTasks = useSelector(selectTasksByCategory('work'))
  const lifeTasks = useSelector(selectTasksByCategory('life'))
  const studyTasks = useSelector(selectTasksByCategory('study'))
  const hobbyTasks = useSelector(selectTasksByCategory('hobby'))

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
      dispatch(classifyTask({ id: currentTask.id, category }))
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

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentTask || isOperating) return

      // Tabキーはモード切り替えに使うのでスキップ
      if (e.key === 'Tab') return

      const is = isKeyPressed(keyBindings, e.key)

      if (is('classifyStudy')) {
        e.preventDefault()
        handleClassify('study')
      } else if (is('classifyWork')) {
        e.preventDefault()
        handleClassify('work')
      } else if (is('classifyHobby')) {
        e.preventDefault()
        handleClassify('hobby')
      } else if (is('classifyLife')) {
        e.preventDefault()
        handleClassify('life')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentTask, isOperating, keyBindings])

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

      // キャンセルボタン中心からの距離で方向を判定
      const deltaX = clientX - centerPosition.x
      const deltaY = clientY - centerPosition.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // 方向判定のしきい値を大きくして、明確な方向のみ判定
      if (distance > 80) {
        // より明確な方向判定（45度の範囲で判定）
        const angle = Math.atan2(deltaY, deltaX)
        const degrees = angle * (180 / Math.PI)

        // 各方向の判定範囲（45度ずつ）
        if (degrees >= -135 && degrees < -45) {
          setDragDirection('up')
        } else if (degrees >= -45 && degrees < 45) {
          setDragDirection('right')
        } else if (degrees >= 45 && degrees < 135) {
          setDragDirection('down')
        } else {
          setDragDirection('left')
        }
      } else {
        // しきい値未満はすべてキャンセル扱い
        setDragDirection('center')
      }
    }

    const handleOperationEnd = (e: MouseEvent | TouchEvent) => {
      e.stopPropagation()
      if (!dragDirection || dragDirection === 'center') {
        resetOperation()
        return
      }
      handleClassify(({ up: 'study', down: 'hobby', left: 'work', right: 'life' } as const)[dragDirection])
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
              onClick={() => dispatch(setMode('list'))}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>一覧</span>
            </button>
            <span>を確認、または</span>
            <button
              onClick={() => dispatch(setMode('create'))}
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
              次: {inboxTasks[1].title.length > 20 ? inboxTasks[1].title.substring(0, 20) + '...' : inboxTasks[1].title}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        {/* 操作オーバーレイ */}
        {isOperating && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in">
            {/* シンプルな方向指示 - タスクカードの中心を基準に配置 */}
            <div className="absolute inset-0">
              {/* 上 - 学習 */}
              <div
                className={`
                absolute left-1/2 -translate-x-1/2
                transition-all duration-75
                ${dragDirection === 'up' ? 'scale-125 -translate-y-2' : 'scale-100 opacity-60'}
              `}
                style={{ top: containerBounds.top + (isMobile ? 20 : 40) }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    ${isMobile ? 'p-3' : 'p-4'} rounded-full
                    ${
                      dragDirection === 'up'
                        ? 'bg-violet-500/30 backdrop-blur-md ring-2 ring-violet-400 shadow-lg'
                        : 'bg-gray-800/50 backdrop-blur-sm'
                    }
                  `}
                  >
                    {React.createElement(categoryIcons.study.icon, {
                      className: `${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${dragDirection === 'up' ? 'text-violet-300' : 'text-gray-400'}`,
                    })}
                  </div>
                  <span
                    className={`font-medium text-sm ${dragDirection === 'up' ? 'text-violet-300' : 'text-gray-400'}`}
                  >
                    {categoryIcons.study.label}
                  </span>
                </div>
              </div>

              {/* 左 - 仕事 */}
              <div
                className={`
                absolute -translate-y-1/2 ${isMobile ? 'left-4' : 'left-20'}
                transition-all duration-75
                ${dragDirection === 'left' ? 'scale-125 -translate-x-2' : 'scale-100 opacity-60'}
              `}
                style={{ top: centerPosition.y }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    ${isMobile ? 'p-3' : 'p-4'} rounded-full
                    ${
                      dragDirection === 'left'
                        ? 'bg-sky-500/30 backdrop-blur-md ring-2 ring-sky-400 shadow-lg'
                        : 'bg-gray-800/50 backdrop-blur-sm'
                    }
                  `}
                  >
                    {React.createElement(categoryIcons.work.icon, {
                      className: `${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${dragDirection === 'left' ? 'text-sky-300' : 'text-gray-400'}`,
                    })}
                  </div>
                  <span
                    className={`font-medium text-sm ${dragDirection === 'left' ? 'text-sky-300' : 'text-gray-400'}`}
                  >
                    {categoryIcons.work.label}
                  </span>
                </div>
              </div>

              {/* 中央 - キャンセル */}
              <div
                className={`
                absolute -translate-x-1/2 -translate-y-1/2
                transition-all duration-75
                ${dragDirection === 'center' ? 'scale-110' : 'scale-100 opacity-60'}
              `}
                style={{ left: centerPosition.x, top: centerPosition.y }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    ${isMobile ? 'p-3' : 'p-4'} rounded-full
                    ${
                      dragDirection === 'center'
                        ? 'bg-red-500/30 backdrop-blur-md ring-2 ring-red-400 shadow-lg'
                        : 'bg-gray-800/50 backdrop-blur-sm'
                    }
                  `}
                  >
                    {React.createElement(actionIcons.cancel, {
                      className: `${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${dragDirection === 'center' ? 'text-red-300' : 'text-gray-400'}`,
                    })}
                  </div>
                  <span
                    className={`font-medium text-sm ${dragDirection === 'center' ? 'text-red-300' : 'text-gray-400'}`}
                  >
                    キャンセル
                  </span>
                </div>
              </div>

              {/* 右 - 生活 */}
              <div
                className={`
                absolute -translate-y-1/2 ${isMobile ? 'right-4' : 'right-20'}
                transition-all duration-75
                ${dragDirection === 'right' ? 'scale-125 translate-x-2' : 'scale-100 opacity-60'}
              `}
                style={{ top: centerPosition.y }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    ${isMobile ? 'p-3' : 'p-4'} rounded-full
                    ${
                      dragDirection === 'right'
                        ? 'bg-teal-500/30 backdrop-blur-md ring-2 ring-teal-400 shadow-lg'
                        : 'bg-gray-800/50 backdrop-blur-sm'
                    }
                  `}
                  >
                    {React.createElement(categoryIcons.life.icon, {
                      className: `${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${dragDirection === 'right' ? 'text-teal-300' : 'text-gray-400'}`,
                    })}
                  </div>
                  <span
                    className={`font-medium text-sm ${dragDirection === 'right' ? 'text-teal-300' : 'text-gray-400'}`}
                  >
                    {categoryIcons.life.label}
                  </span>
                </div>
              </div>

              {/* 下 - 趣味 */}
              <div
                className={`
                absolute left-1/2 -translate-x-1/2
                transition-all duration-75
                ${dragDirection === 'down' ? 'scale-125 translate-y-2' : 'scale-100 opacity-60'}
              `}
                style={{ top: containerBounds.bottom - (isMobile ? 80 : 100) }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    ${isMobile ? 'p-3' : 'p-4'} rounded-full
                    ${
                      dragDirection === 'down'
                        ? 'bg-pink-500/30 backdrop-blur-md ring-2 ring-pink-400 shadow-lg'
                        : 'bg-gray-800/50 backdrop-blur-sm'
                    }
                  `}
                  >
                    {React.createElement(categoryIcons.hobby.icon, {
                      className: `${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${dragDirection === 'down' ? 'text-pink-300' : 'text-gray-400'}`,
                    })}
                  </div>
                  <span
                    className={`font-medium text-sm ${dragDirection === 'down' ? 'text-pink-300' : 'text-gray-400'}`}
                  >
                    {categoryIcons.hobby.label}
                  </span>
                </div>
              </div>
            </div>

            {/* ドラッグライン */}
            {dragDirection && dragDirection !== 'center' && (
              <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: '100%', height: '100%' }}>
                <line
                  x1={centerPosition.x}
                  y1={centerPosition.y}
                  x2={currentPosition.x}
                  y2={currentPosition.y}
                  stroke={({ up: '#a78bfa', down: '#f9a8d4', left: '#7dd3fc', right: '#5eead4' } as const)[dragDirection]}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.5"
                />
              </svg>
            )}

            {/* カーソル/タッチ位置のトラッカー */}
            <div
              className="fixed w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none z-50 ring-2 ring-white/30"
              style={{
                left: `${currentPosition.x}px`,
                top: `${currentPosition.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
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
                className="absolute bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-2xl border border-gray-600/30 shadow-lg"
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
              relative bg-gradient-to-br from-violet-900/90 via-purple-800/90 to-indigo-900/90 
              backdrop-blur-sm rounded-2xl shadow-2xl
              ${isMobile ? 'p-5 w-[220px] min-h-[120px]' : 'p-8 w-[340px] min-h-[200px]'}
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
                <span className="block break-words">{currentTask.title}</span>
              </h3>
            </div>

            {/* ホバーエフェクト */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
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
