import React from 'react'

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-xl shadow-2xl border-b border-gray-800/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur-lg opacity-50"></div>
            <div className="relative bg-gray-900 rounded-lg p-2">
              <span className="text-2xl">📥</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                InboxToAction
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase mt-0.5">
              Focus on what matters
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}