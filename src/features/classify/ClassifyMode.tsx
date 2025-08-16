import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { classifyTask, selectInboxTasks } from '../../store/slices/tasksSlice'
import { useResponsive } from '../../hooks/useResponsive'
import type { Category } from '../../types'

export const ClassifyMode: React.FC = () => {
  const dispatch = useDispatch()
  const inboxTasks = useSelector(selectInboxTasks)
  const currentTask = inboxTasks[0]
  const { isMobile } = useResponsive()
  
  // 操作モード管理
  const [isOperating, setIsOperating] = useState(false)
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | 'left' | 'right' | 'center' | null>(null)
  const startPosition = useRef({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClassify = (category: Category) => {
    if (currentTask) {
      dispatch(classifyTask({ id: currentTask.id, category }))
      // アニメーション後にリセット
      setTimeout(() => {
        setIsOperating(false)
        setDragDirection(null)
      }, 300)
    }
  }

  // 操作開始（クリック/タップ）
  const handleOperationStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentTask) return
    
    // タッチイベントの場合のみ処理（クリックは別途処理）
    if ('touches' in e) {
      const clientX = e.touches[0].clientX
      const clientY = e.touches[0].clientY
      
      setIsOperating(true)
      startPosition.current = { x: clientX, y: clientY }
      setCurrentPosition({ x: clientX, y: clientY })
      setDragDirection('center')
    }
  }
  
  // マウスダウン（PC版のみ）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentTask || isMobile) return
    
    const clientX = e.clientX
    const clientY = e.clientY
    
    setIsOperating(true)
    startPosition.current = { x: clientX, y: clientY }
    setCurrentPosition({ x: clientX, y: clientY })
    setDragDirection('center')
  }

  // 操作中（ドラッグ）
  const handleOperationMove = (e: MouseEvent | TouchEvent) => {
    if (!isOperating) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setCurrentPosition({ x: clientX, y: clientY })
    
    const deltaX = clientX - startPosition.current.x
    const deltaY = clientY - startPosition.current.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // 中央エリア（キャンセルゾーン）
    if (distance < 30) {
      setDragDirection('center')
    } 
    // 方向判定
    else if (distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setDragDirection(deltaX < 0 ? 'left' : 'right')
      } else {
        setDragDirection(deltaY < 0 ? 'up' : 'down')
      }
    } else {
      setDragDirection(null)
    }
  }

  // 操作終了（ドロップ）
  const handleOperationEnd = () => {
    if (!isOperating || !currentTask) return
    
    // 方向に基づいてアクション
    if (dragDirection && dragDirection !== 'center' && dragDirection !== null) {
      switch (dragDirection) {
        case 'up':
          handleClassify('study')
          break
        case 'down':
          handleClassify('hobby')
          break
        case 'left':
          handleClassify('work')
          break
        case 'right':
          handleClassify('life')
          break
      }
    } else {
      // キャンセル
      setIsOperating(false)
      setDragDirection(null)
    }
  }

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentTask || isOperating) return
      
      // Tabキーはモード切り替えに使うのでスキップ
      if (e.key === 'Tab') return

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault()
          handleClassify('study')
          break
        case 'a':
        case 'arrowleft':
          e.preventDefault()
          handleClassify('work')
          break
        case 's':
        case 'arrowdown':
          e.preventDefault()
          handleClassify('hobby')
          break
        case 'd':
        case 'arrowright':
          e.preventDefault()
          handleClassify('life')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentTask, isOperating])

  // グローバルイベントリスナー
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => handleOperationMove(e)
    const handleEnd = () => handleOperationEnd()
    const handleTouchCancel = () => {
      // タッチがキャンセルされた場合もリセット
      setIsOperating(false)
      setDragDirection(null)
    }

    if (isOperating) {
      if (isMobile) {
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', handleEnd)
        window.addEventListener('touchcancel', handleTouchCancel)
      } else {
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleEnd)
      }
    }

    return () => {
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
    }
  }, [isOperating, dragDirection, currentTask, isMobile])

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">すべて分類完了！</h2>
          <p className="text-gray-400">新しいタスクを追加するか、一覧を確認してください</p>
        </div>
      </div>
    )
  }

  // カテゴリ情報
  const categories = [
    { id: 'study' as Category, label: '学習', icon: '📚', color: 'from-violet-600 to-violet-700', position: 'top' },
    { id: 'work' as Category, label: '仕事', icon: '🏢', color: 'from-sky-600 to-sky-700', position: 'left' },
    { id: 'life' as Category, label: '生活', icon: '🏠', color: 'from-teal-600 to-teal-700', position: 'right' },
    { id: 'hobby' as Category, label: '趣味', icon: '🎮', color: 'from-pink-600 to-pink-700', position: 'bottom' },
  ]

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-200px)]" ref={containerRef}>
      <div className="relative h-full flex items-center justify-center">
        
        {/* 操作オーバーレイ */}
        {isOperating && (
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in">
            {/* ドラッグ方向インジケーター */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64 md:w-96 md:h-96">
                {/* 中央のキャンセルゾーン */}
                <div className={`
                  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${dragDirection === 'center' 
                    ? 'bg-gray-600/80 scale-110 shadow-lg shadow-gray-600/50' 
                    : 'bg-gray-700/50 scale-100'
                  }
                `}>
                  <span className={`text-2xl transition-opacity ${dragDirection === 'center' ? 'opacity-100' : 'opacity-50'}`}>
                    ❌
                  </span>
                </div>

                {/* 方向別ドロップゾーン */}
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`
                      absolute flex flex-col items-center justify-center
                      w-24 h-24 md:w-32 md:h-32 rounded-2xl
                      bg-gradient-to-br ${category.color}
                      transition-all duration-200
                      ${category.position === 'top' ? 'top-0 left-1/2 -translate-x-1/2' : ''}
                      ${category.position === 'bottom' ? 'bottom-0 left-1/2 -translate-x-1/2' : ''}
                      ${category.position === 'left' ? 'left-0 top-1/2 -translate-y-1/2' : ''}
                      ${category.position === 'right' ? 'right-0 top-1/2 -translate-y-1/2' : ''}
                      ${dragDirection === category.position 
                        ? 'scale-110 shadow-2xl ring-4 ring-white/60' 
                        : 'scale-90 opacity-60'
                      }
                    `}
                  >
                    <div className={`text-3xl md:text-4xl transition-transform ${
                      dragDirection === category.position ? 'scale-125' : 'scale-100'
                    }`}>
                      {category.icon}
                    </div>
                    <div className="text-white font-bold text-sm md:text-base mt-1">
                      {category.label}
                    </div>
                  </div>
                ))}

                {/* カーソル/タッチ位置のトラッカー */}
                <div 
                  className="fixed w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none z-50"
                  style={{
                    left: `${currentPosition.x}px`,
                    top: `${currentPosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* カテゴリボタン（通常表示） */}
        {!isOperating && categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleClassify(category.id)}
            className={`
              absolute flex flex-col items-center justify-center
              bg-gradient-to-br ${category.color} text-white rounded-2xl
              shadow-lg hover:shadow-xl transition-all hover:scale-105
              ${category.position === 'top' ? 'top-0 left-1/2 -translate-x-1/2 w-32 h-24 md:w-40 md:h-32' : ''}
              ${category.position === 'bottom' ? 'bottom-0 left-1/2 -translate-x-1/2 w-32 h-24 md:w-40 md:h-32' : ''}
              ${category.position === 'left' ? 'left-0 top-1/2 -translate-y-1/2 w-32 h-24 md:w-40 md:h-32' : ''}
              ${category.position === 'right' ? 'right-0 top-1/2 -translate-y-1/2 w-32 h-24 md:w-40 md:h-32' : ''}
            `}
          >
            <div className="text-3xl md:text-4xl mb-1">{category.icon}</div>
            <div className="text-sm md:text-base font-bold">{category.label}</div>
            {!isMobile && (
              <div className="text-xs opacity-80 mt-1">
                {category.position === 'top' && 'W / ↑'}
                {category.position === 'left' && 'A / ←'}
                {category.position === 'right' && 'D / →'}
                {category.position === 'bottom' && 'S / ↓'}
              </div>
            )}
          </button>
        ))}

        {/* 中央のタスクカードスタック */}
        <div className="relative">
          {/* 背後のカード（スタック表現 - 改善版） */}
          {inboxTasks.length > 3 && (
            <div className="absolute inset-0 bg-gray-700/20 rounded-xl transform rotate-3 translate-y-3" />
          )}
          {inboxTasks.length > 2 && (
            <div className="absolute inset-0 bg-gray-700/30 rounded-xl transform -rotate-2 translate-y-2" />
          )}
          {inboxTasks.length > 1 && (
            <div className="absolute inset-0 bg-gray-700/40 rounded-xl transform rotate-1 translate-y-1" />
          )}
          
          {/* メインのタスクカード */}
          <div
            ref={cardRef}
            className={`
              relative bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-2xl
              ${isMobile ? 'p-4 w-[calc(100vw-300px)] max-w-[200px]' : 'p-6 md:p-8 min-w-[280px] max-w-[400px]'}
              border-2 border-gray-600
              ${isOperating ? 'scale-95 opacity-90' : 'hover:scale-105'}
              transition-all duration-200 cursor-pointer select-none
            `}
            onMouseDown={handleMouseDown}
            onTouchStart={handleOperationStart}
          >
            {/* タスク内容 */}
            <div className="text-center">
              <h3 className={`font-bold text-gray-100 mb-4 flex items-center justify-center break-words ${isMobile ? 'text-base min-h-[2.5em]' : 'text-xl md:text-2xl min-h-[3em]'}`}>
                <span className="block w-full overflow-wrap break-words">
                  {currentTask.title}
                </span>
              </h3>
              
              {/* 操作ヒント */}
              <div className="text-xs text-gray-500 mt-4">
                {isMobile ? (
                  <p>タップしてドラッグ</p>
                ) : (
                  <p>クリックしてドラッグ または キーボード操作</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}