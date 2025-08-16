import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { classifyTask, selectInboxTasks } from '../../store/slices/tasksSlice'
import { useResponsive } from '../../hooks/useResponsive'
import { categoryIcons, actionIcons } from '../../config/icons'
import { Trophy } from 'lucide-react'
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

  // 操作終了（ドロップ）
  const handleOperationEnd = () => {
    if (!isOperating || !currentTask) return
    
    // 方向に基づいてアクション（centerやnullの場合はキャンセル）
    if (dragDirection === 'up') {
      handleClassify('study')
    } else if (dragDirection === 'down') {
      handleClassify('hobby')
    } else if (dragDirection === 'left') {
      handleClassify('work')
    } else if (dragDirection === 'right') {
      handleClassify('life')
    } else {
      // center または null の場合はすべてキャンセル
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
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">すべて分類完了！</h2>
          <p className="text-gray-400">新しいタスクを追加するか、一覧を確認してください</p>
        </div>
      </div>
    )
  }

  // カテゴリ情報
  const categories = [
    { id: 'study' as Category, ...categoryIcons.study, position: 'top' },
    { id: 'work' as Category, ...categoryIcons.work, position: 'left' },
    { id: 'life' as Category, ...categoryIcons.life, position: 'right' },
    { id: 'hobby' as Category, ...categoryIcons.hobby, position: 'bottom' },
  ]

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-200px)]" ref={containerRef}>
      <div className="relative h-full flex items-center justify-center">
        
        {/* 操作オーバーレイ */}
        {isOperating && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in">
            {/* 画面全体を使った4方向ゾーン */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {/* 上部ゾーン - 学習 */}
              <div className={`
                col-span-3 flex items-start justify-center pt-8
                transition-all duration-200
                ${dragDirection === 'up' 
                  ? 'bg-gradient-to-b from-violet-600/50 to-transparent' 
                  : ''
                }
              `}>
                <div className={`
                  flex flex-col items-center justify-center
                  px-8 py-4 rounded-2xl
                  bg-gradient-to-br from-violet-600 to-violet-700
                  transition-all duration-200
                  ${dragDirection === 'up' 
                    ? 'scale-125 shadow-2xl ring-4 ring-white/60' 
                    : 'scale-100 opacity-70'
                  }
                `}>
                  <div className={`transition-transform ${
                    dragDirection === 'up' ? 'scale-125' : 'scale-100'
                  }`}>
                    {React.createElement(categoryIcons.study.icon, {
                      className: `w-12 h-12 md:w-14 md:h-14 text-white`
                    })}
                  </div>
                  <div className="text-white font-bold text-lg md:text-xl mt-2">
                    {categoryIcons.study.label}
                  </div>
                </div>
              </div>

              {/* 左側ゾーン - 仕事 */}
              <div className={`
                row-start-2 flex items-center justify-start pl-8
                transition-all duration-200
                ${dragDirection === 'left' 
                  ? 'bg-gradient-to-r from-sky-600/50 to-transparent' 
                  : ''
                }
              `}>
                <div className={`
                  flex flex-col items-center justify-center
                  px-6 py-4 rounded-2xl
                  bg-gradient-to-br from-sky-600 to-sky-700
                  transition-all duration-200
                  ${dragDirection === 'left' 
                    ? 'scale-125 shadow-2xl ring-4 ring-white/60' 
                    : 'scale-100 opacity-70'
                  }
                `}>
                  <div className={`transition-transform ${
                    dragDirection === 'left' ? 'scale-125' : 'scale-100'
                  }`}>
                    {React.createElement(categoryIcons.work.icon, {
                      className: `w-12 h-12 md:w-14 md:h-14 text-white`
                    })}
                  </div>
                  <div className="text-white font-bold text-lg md:text-xl mt-2">
                    {categoryIcons.work.label}
                  </div>
                </div>
              </div>

              {/* 中央キャンセルゾーン */}
              <div className="row-start-2 col-start-2 flex items-center justify-center">
                <div className={`
                  w-32 h-32 md:w-40 md:h-40 rounded-full 
                  flex flex-col items-center justify-center
                  transition-all duration-200
                  ${dragDirection === 'center' 
                    ? 'bg-gray-600/90 scale-110 shadow-2xl ring-4 ring-gray-400/50' 
                    : 'bg-gray-700/70 scale-100'
                  }
                `}>
                  <div className={`transition-opacity ${
                    dragDirection === 'center' ? 'opacity-100' : 'opacity-60'
                  }`}>
                    {React.createElement(actionIcons.cancel, {
                      className: `w-12 h-12 md:w-14 md:h-14 text-white`
                    })}
                  </div>
                  <span className={`text-white text-sm md:text-base mt-2 font-medium ${
                    dragDirection === 'center' ? 'opacity-100' : 'opacity-60'
                  }`}>
                    キャンセル
                  </span>
                </div>
              </div>

              {/* 右側ゾーン - 生活 */}
              <div className={`
                row-start-2 col-start-3 flex items-center justify-end pr-8
                transition-all duration-200
                ${dragDirection === 'right' 
                  ? 'bg-gradient-to-l from-teal-600/50 to-transparent' 
                  : ''
                }
              `}>
                <div className={`
                  flex flex-col items-center justify-center
                  px-6 py-4 rounded-2xl
                  bg-gradient-to-br from-teal-600 to-teal-700
                  transition-all duration-200
                  ${dragDirection === 'right' 
                    ? 'scale-125 shadow-2xl ring-4 ring-white/60' 
                    : 'scale-100 opacity-70'
                  }
                `}>
                  <div className={`transition-transform ${
                    dragDirection === 'right' ? 'scale-125' : 'scale-100'
                  }`}>
                    {React.createElement(categoryIcons.life.icon, {
                      className: `w-12 h-12 md:w-14 md:h-14 text-white`
                    })}
                  </div>
                  <div className="text-white font-bold text-lg md:text-xl mt-2">
                    {categoryIcons.life.label}
                  </div>
                </div>
              </div>

              {/* 下部ゾーン - 趣味 */}
              <div className={`
                row-start-3 col-span-3 flex items-end justify-center pb-8
                transition-all duration-200
                ${dragDirection === 'down' 
                  ? 'bg-gradient-to-t from-pink-600/50 to-transparent' 
                  : ''
                }
              `}>
                <div className={`
                  flex flex-col items-center justify-center
                  px-8 py-4 rounded-2xl
                  bg-gradient-to-br from-pink-600 to-pink-700
                  transition-all duration-200
                  ${dragDirection === 'down' 
                    ? 'scale-125 shadow-2xl ring-4 ring-white/60' 
                    : 'scale-100 opacity-70'
                  }
                `}>
                  <div className={`transition-transform ${
                    dragDirection === 'down' ? 'scale-125' : 'scale-100'
                  }`}>
                    {React.createElement(categoryIcons.hobby.icon, {
                      className: `w-12 h-12 md:w-14 md:h-14 text-white`
                    })}
                  </div>
                  <div className="text-white font-bold text-lg md:text-xl mt-2">
                    {categoryIcons.hobby.label}
                  </div>
                </div>
              </div>
            </div>

            {/* カーソル/タッチ位置のトラッカー */}
            <div 
              className="fixed w-6 h-6 bg-white rounded-full shadow-2xl pointer-events-none z-50 ring-2 ring-white/50"
              style={{
                left: `${currentPosition.x}px`,
                top: `${currentPosition.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
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
            <div className="mb-1">
              {React.createElement(category.icon, {
                className: "w-8 h-8 md:w-10 md:h-10 text-white mx-auto"
              })}
            </div>
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
              <h3 className={`font-bold text-gray-100 flex items-center justify-center break-words ${isMobile ? 'text-base min-h-[2.5em]' : 'text-xl md:text-2xl min-h-[3em]'}`}>
                <span className="block w-full overflow-wrap break-words">
                  {currentTask.title}
                </span>
              </h3>
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