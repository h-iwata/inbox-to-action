import React from 'react'
import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  variant: 'create' | 'list' | 'execute'
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
  onMoveToTop?: (id: string) => void
  onToggleExecuting?: (id: string) => void
  className?: string
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  variant,
  onComplete,
  onDelete,
  onMoveToTop,
  onToggleExecuting,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'create':
        return 'bg-gray-800 border border-gray-700 p-3 rounded-lg hover:shadow-lg transition-shadow'
      case 'list':
        return 'bg-gray-800 border border-gray-700 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors'
      case 'execute':
        return 'bg-gray-800 border-2 border-gray-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all'
      default:
        return ''
    }
  }

  const isPriority = task.order === 1 && task.category !== 'inbox'
  const isExecuting = task.isExecuting === true
  const baseStyles = getVariantStyles()
  const priorityStyles = isExecuting ? 'border-amber-600/50 bg-gradient-to-r from-amber-900/10 to-orange-900/10' : 
                         isPriority && !isExecuting ? 'border-gray-600 bg-gray-750/50' : ''

  const getTimeRemaining = () => {
    if (isPriority) return null
    
    const now = new Date()
    const updatedAt = new Date(task.updated_at)
    const hoursRemaining = Math.floor((24 * 60 * 60 * 1000 - (now.getTime() - updatedAt.getTime())) / (1000 * 60 * 60))
    
    if (hoursRemaining <= 6) {
      return <span className="text-red-500 text-sm font-medium">{hoursRemaining}h</span>
    }
    return <span className="text-gray-500 text-sm">{hoursRemaining}h</span>
  }

  const handleClick = () => {
    if (variant === 'list') {
      if (isPriority && onToggleExecuting) {
        onToggleExecuting(task.id)
      } else if (onMoveToTop) {
        onMoveToTop(task.id)
      }
    }
  }

  return (
    <div
      className={`${baseStyles} ${priorityStyles} ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-100 font-medium">{task.title}</p>
          {isPriority && variant === 'list' && (
            <div className="flex items-center gap-2 mt-1">
              {isExecuting ? (
                <>
                  <span className="text-amber-500">🔥</span>
                  <span className="text-sm text-amber-400 font-medium">実行中</span>
                  <span className="text-gray-500">∞</span>
                </>
              ) : (
                <>
                  <span className="text-gray-400">⏸️</span>
                  <span className="text-sm text-gray-400 font-medium">一時停止</span>
                  <span className="text-gray-500">∞</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isPriority && variant === 'list' && getTimeRemaining()}
          
          {variant === 'execute' && onComplete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onComplete(task.id)
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              ✓ 完了
            </button>
          )}
          
          {variant === 'create' && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}