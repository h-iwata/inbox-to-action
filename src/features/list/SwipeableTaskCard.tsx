import { Inbox, Play, Target, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import type React from 'react'
import { useState } from 'react'
import { useTaskActions } from '@/store/tasksStore'
import type { Task } from '@/types'
import {
  clampSwipeOffset,
  detectSwipeDirection,
  isSwipeVisible,
  isTap,
  resolveSwipeAction,
  swipeProgress,
} from './swipe-helpers'

interface SwipeState {
  startX: number
  currentX: number
  direction: 'left' | 'right' | null
}

const initialSwipeState: SwipeState = {
  startX: 0,
  currentX: 0,
  direction: null,
}

interface SwipeableTaskCardProps {
  task: Task
  index: number
  onDelete: (task: Task) => void
  onTap: (task: Task, index: number) => void
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({ task, index, onDelete, onTap }) => {
  const { moveTaskToInbox } = useTaskActions()
  const [swipeState, setSwipeState] = useState<SwipeState>(initialSwipeState)
  const [isSwiping, setIsSwiping] = useState(false)

  const isSwipingLeft = swipeState.direction === 'left'
  const isSwipingRight = swipeState.direction === 'right'

  const rawOffset = swipeState.currentX - swipeState.startX
  const swipeOffset = isSwiping ? clampSwipeOffset(rawOffset) : 0

  const handleStart = (clientX: number) => {
    setIsSwiping(true)
    setSwipeState({
      startX: clientX,
      currentX: clientX,
      direction: null,
    })
  }

  const handleMove = (clientX: number) => {
    if (!isSwiping) return

    const direction = detectSwipeDirection(clientX - swipeState.startX)
    if (!direction) return

    setSwipeState(prev => ({ ...prev, currentX: clientX, direction }))
  }

  const handleEnd = () => {
    if (!isSwiping) return

    const action = resolveSwipeAction(rawOffset, swipeState.direction)
    if (action === 'moveToInbox') {
      moveTaskToInbox(task.id)
    } else if (action === 'delete') {
      onDelete(task)
    }

    setIsSwiping(false)
    setSwipeState(initialSwipeState)
  }

  return (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        layout: { duration: 0.2, ease: 'easeInOut' },
        opacity: { duration: 0.15 },
        y: { duration: 0.15 },
      }}
      className="relative"
      style={{ overflow: 'hidden' }}
    >
      {/* スワイプ背景 */}
      <div
        className={`absolute inset-0 flex items-center ${
          isSwipingLeft
            ? 'bg-linear-to-r from-violet-600 to-violet-500 justify-end pr-4'
            : isSwipingRight
              ? 'bg-linear-to-l from-red-600 to-red-500 justify-start pl-4'
              : 'hidden'
        } rounded-xl`}
        style={{
          opacity: swipeProgress(swipeOffset),
          zIndex: 0,
        }}
      >
        {isSwipingLeft ? (
          <div className="flex items-center gap-2 text-white">
            <span className="font-semibold text-sm">Inbox</span>
            <Inbox className="w-5 h-5" />
          </div>
        ) : isSwipingRight ? (
          <div className="flex items-center gap-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="font-semibold text-sm">削除</span>
          </div>
        ) : null}
      </div>

      {/* タスクカード */}
      <div
        className={`relative rounded-xl p-4 border-2 backdrop-blur-sm shadow-lg transition-colors cursor-pointer ${
          index === 0
            ? 'bg-linear-to-r from-orange-500/10 to-yellow-500/10 border-orange-400/60 shadow-orange-500/20 hover:from-orange-500/20 hover:to-yellow-500/20 hover:border-orange-400/80'
            : isSwiping && isSwipeVisible(swipeOffset)
              ? 'bg-gray-800/60 border-gray-700/50'
              : 'bg-linear-to-r from-gray-800/80 to-gray-800/60 border-gray-700/50 hover:border-gray-600 hover:shadow-xl'
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
          position: 'relative',
          zIndex: isSwiping ? 10 : 1,
        }}
        onClick={() => {
          if (isTap(swipeOffset)) {
            onTap(task, index)
          }
        }}
        onTouchStart={e => {
          e.stopPropagation()
          handleStart(e.touches[0].clientX)
        }}
        onMouseDown={e => {
          e.stopPropagation()
          handleStart(e.clientX)
        }}
        onTouchMove={e => {
          e.stopPropagation()
          handleMove(e.touches[0].clientX)
        }}
        onMouseMove={e => {
          if (isSwiping) {
            e.stopPropagation()
            handleMove(e.clientX)
          }
        }}
        onTouchEnd={e => {
          e.stopPropagation()
          handleEnd()
        }}
        onMouseUp={e => {
          e.stopPropagation()
          handleEnd()
        }}
        onMouseLeave={() => {
          if (isSwiping) {
            handleEnd()
          }
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium overflow-wrap-break-word whitespace-pre-wrap ${index === 0 ? 'text-orange-100 text-lg' : 'text-gray-100'}`}
            >
              {task.title}
            </p>
            {index === 0 && (
              <div className="flex items-center gap-1 mt-1 opacity-70">
                <Play className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-orange-400">タップで実行開始</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {index === 0 && (
              <motion.div
                className="bg-orange-400/20 p-1.5 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <Target className="w-4 h-4 text-orange-400" />
              </motion.div>
            )}
            <div className={`text-sm font-semibold ${index === 0 ? 'text-orange-400' : 'text-gray-400'}`}>
              #{index + 1}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
