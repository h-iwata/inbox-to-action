import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { moveToTop, deleteTask, selectTasksByCategory, selectDailyStats, changeCategory, toggleExecuting, reorderTasksInCategory } from '../../store/slices/tasksSlice'
import { TaskCard } from '../../components/TaskCard/TaskCard'
import type { Category, Task } from '../../types'

export const ListMode: React.FC = () => {
  const dispatch = useDispatch()
  const dailyStats = useSelector(selectDailyStats)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<Category | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  const categories: { id: Category; label: string; icon: string; color: string }[] = [
    { id: 'work', label: '仕事', icon: '🏢', color: 'from-blue-500 to-cyan-500' },
    { id: 'life', label: '生活', icon: '🏠', color: 'from-green-500 to-emerald-500' },
    { id: 'study', label: '学習', icon: '📚', color: 'from-purple-500 to-indigo-500' },
    { id: 'hobby', label: '趣味', icon: '🎮', color: 'from-orange-500 to-red-500' },
  ]

  const handleMoveToTop = (taskId: string) => {
    dispatch(moveToTop(taskId))
  }

  const handleToggleExecuting = (taskId: string) => {
    dispatch(toggleExecuting(taskId))
  }

  const handleDelete = (taskId: string) => {
    if (confirm('タスクを削除しますか？')) {
      dispatch(deleteTask(taskId))
    }
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  const handleDragOver = (e: React.DragEvent, category: Category) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCategory(category)
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDrop = (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault()
    
    // タスクの上にドロップされた場合は処理しない（handleDropOnTaskで処理済み）
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('[draggable="true"]')) {
      return
    }
    
    // 空のカテゴリエリアにドロップされた場合のみカテゴリ変更
    if (draggedTask && draggedTask.category !== targetCategory) {
      dispatch(changeCategory({ taskId: draggedTask.id, newCategory: targetCategory }))
    }
    
    setDraggedTask(null)
    setDragOverCategory(null)
    setDragOverTaskId(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverCategory(null)
    setDragOverTaskId(null)
  }

  const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTaskId(taskId)
  }

  const handleDropOnTask = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedTask) return
    if (draggedTask.id === targetTask.id) return
    
    // 同じカテゴリ内なら順序変更、違うカテゴリなら移動
    if (draggedTask.category === targetTask.category) {
      // 同じカテゴリ内での順序変更
      dispatch(reorderTasksInCategory({
        taskId: draggedTask.id,
        newPosition: targetTask.order,
        category: targetTask.category as Category
      }))
    } else {
      // 異なるカテゴリへの移動
      dispatch(changeCategory({ 
        taskId: draggedTask.id, 
        newCategory: targetTask.category as Category 
      }))
    }
    
    setDraggedTask(null)
    setDragOverTaskId(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {categories.map((category) => {
        const tasks = useSelector(selectTasksByCategory(category.id))
        
        const isDropTarget = dragOverCategory === category.id
        const isEmpty = tasks.length === 0

        return (
          <div 
            key={category.id} 
            className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
              isDropTarget ? 'border-blue-500 shadow-lg scale-[1.02]' : 'border-gray-200'
            } ${isEmpty && !isDropTarget ? 'opacity-50' : ''}`}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.id)}
          >
            <div className={`bg-gradient-to-r ${category.color} text-white px-6 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="text-lg font-bold">{category.label}</h3>
              </div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {tasks.length}件
              </span>
            </div>
            
            <div className={`p-4 space-y-3 min-h-[100px] ${isEmpty ? 'flex items-center justify-center' : ''}`}>
              {isEmpty && !isDropTarget ? (
                <p className="text-gray-400 text-sm">タスクをドラッグして追加</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOverTask(e, task.id)}
                    onDrop={(e) => handleDropOnTask(e, task)}
                    onDragLeave={() => setDragOverTaskId(null)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      handleDelete(task.id)
                    }}
                    className={`cursor-move transition-all ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    } ${
                      dragOverTaskId === task.id && draggedTask?.id !== task.id && draggedTask?.category === task.category
                        ? 'transform -translate-y-1 scale-[1.02]' 
                        : dragOverTaskId === task.id && draggedTask?.id !== task.id && draggedTask?.category !== task.category
                        ? 'ring-2 ring-blue-400 ring-offset-2'
                        : ''
                    }`}
                  >
                    <TaskCard
                      task={task}
                      variant="list"
                      onMoveToTop={handleMoveToTop}
                      onToggleExecuting={handleToggleExecuting}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}

      {/* 統計情報 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 今日の活動</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{dailyStats.created}</div>
            <div className="text-sm text-gray-600">作成</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{dailyStats.classified}</div>
            <div className="text-sm text-gray-600">分類</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{dailyStats.completed}</div>
            <div className="text-sm text-gray-600">完了</div>
          </div>
        </div>
      </div>
    </div>
  )
}