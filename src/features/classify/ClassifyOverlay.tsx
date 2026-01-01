import React from 'react'
import { categoryIcons, actionIcons } from '../../config/icons'

type Direction = 'up' | 'down' | 'left' | 'right'
type DragDirection = Direction | 'center' | null

interface Position {
  x: number
  y: number
}

interface ContainerBounds {
  top: number
  bottom: number
}

interface ClassifyOverlayProps {
  dragDirection: DragDirection
  centerPosition: Position
  currentPosition: Position
  containerBounds: ContainerBounds
  isMobile: boolean
}

export const ClassifyOverlay: React.FC<ClassifyOverlayProps> = ({
  dragDirection,
  centerPosition,
  currentPosition,
  containerBounds,
  isMobile,
}) => {
  const iconSize = isMobile ? 'w-6 h-6' : 'w-8 h-8'
  const padding = isMobile ? 'p-3' : 'p-4'

  const categoryButtons = [
    {
      direction: 'up' as const,
      category: 'study' as const,
      label: categoryIcons.study.label,
      icon: categoryIcons.study.icon,
      activeClass: 'bg-violet-500/30 backdrop-blur-md ring-2 ring-violet-400 shadow-lg',
      activeTextClass: 'text-violet-300',
      positionClass: 'absolute left-1/2 -translate-x-1/2',
      activeTransform: 'scale-125 -translate-y-2',
      style: { top: containerBounds.top + (isMobile ? 20 : 40) },
    },
    {
      direction: 'left' as const,
      category: 'work' as const,
      label: categoryIcons.work.label,
      icon: categoryIcons.work.icon,
      activeClass: 'bg-sky-500/30 backdrop-blur-md ring-2 ring-sky-400 shadow-lg',
      activeTextClass: 'text-sky-300',
      positionClass: `absolute -translate-y-1/2 ${isMobile ? 'left-4' : 'left-20'}`,
      activeTransform: 'scale-125 -translate-x-2',
      style: { top: centerPosition.y },
    },
    {
      direction: 'right' as const,
      category: 'life' as const,
      label: categoryIcons.life.label,
      icon: categoryIcons.life.icon,
      activeClass: 'bg-teal-500/30 backdrop-blur-md ring-2 ring-teal-400 shadow-lg',
      activeTextClass: 'text-teal-300',
      positionClass: `absolute -translate-y-1/2 ${isMobile ? 'right-4' : 'right-20'}`,
      activeTransform: 'scale-125 translate-x-2',
      style: { top: centerPosition.y },
    },
    {
      direction: 'down' as const,
      category: 'hobby' as const,
      label: categoryIcons.hobby.label,
      icon: categoryIcons.hobby.icon,
      activeClass: 'bg-pink-500/30 backdrop-blur-md ring-2 ring-pink-400 shadow-lg',
      activeTextClass: 'text-pink-300',
      positionClass: 'absolute left-1/2 -translate-x-1/2',
      activeTransform: 'scale-125 translate-y-2',
      style: { top: containerBounds.bottom - (isMobile ? 80 : 100) },
    },
  ]

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0">
        {/* カテゴリボタン */}
        {categoryButtons.map(button => {
          const isActive = dragDirection === button.direction
          return (
            <div
              key={button.direction}
              className={`
                ${button.positionClass}
                transition-all duration-75
                ${isActive ? button.activeTransform : 'scale-100 opacity-60'}
              `}
              style={button.style}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`
                    ${padding} rounded-full
                    ${isActive ? button.activeClass : 'bg-gray-800/50 backdrop-blur-sm'}
                  `}
                >
                  {React.createElement(button.icon, {
                    className: `${iconSize} ${isActive ? button.activeTextClass : 'text-gray-400'}`,
                  })}
                </div>
                <span className={`font-medium text-sm ${isActive ? button.activeTextClass : 'text-gray-400'}`}>
                  {button.label}
                </span>
              </div>
            </div>
          )
        })}

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
                ${padding} rounded-full
                ${
                  dragDirection === 'center'
                    ? 'bg-red-500/30 backdrop-blur-md ring-2 ring-red-400 shadow-lg'
                    : 'bg-gray-800/50 backdrop-blur-sm'
                }
              `}
            >
              {React.createElement(actionIcons.cancel, {
                className: `${iconSize} ${dragDirection === 'center' ? 'text-red-300' : 'text-gray-400'}`,
              })}
            </div>
            <span className={`font-medium text-sm ${dragDirection === 'center' ? 'text-red-300' : 'text-gray-400'}`}>
              キャンセル
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
  )
}
