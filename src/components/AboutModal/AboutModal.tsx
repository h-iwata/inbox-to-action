import React, { useEffect } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { X, Lightbulb, RotateCw, Smartphone, Monitor, PenTool, FolderOpen, List, Target, BarChart3, Sparkles, Flame, Calendar, CheckCircle } from 'lucide-react'
import { categoryIcons } from '../../config/icons'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { isMobile } = useResponsive()

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleBackdropClick}
      >
        {/* モーダル本体 */}
        <div className={`
          fixed bg-gray-800 rounded-2xl shadow-2xl overflow-hidden
          ${isMobile 
            ? 'inset-x-4 inset-y-12 animate-slide-up' 
            : 'top-1/2 left-1/2 w-[90%] max-w-3xl max-h-[85vh] animate-slide-up-center'
          }
        `}
        style={!isMobile ? { transform: 'translate(-50%, -50%)' } : undefined}>
          {/* ヘッダー */}
          <div className="sticky top-0 bg-gradient-to-r from-violet-800 to-cyan-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">InboxToAction について</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="overflow-y-auto max-h-[calc(85vh-4rem)] px-6 py-6 space-y-8">
            {/* コンセプト */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                コンセプト
              </h3>
              <div className="text-gray-300 space-y-2">
                <p>
                  InboxToActionは、GTD（Getting Things Done）メソッドをベースにした
                  シンプルなタスク管理アプリです。
                </p>
                <p>
                  思いついたアイデアを即座に記録し、4つのカテゴリに分類、
                  優先順位を決めて、着実に実行していくことができます。
                </p>
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-sm">
                    <strong className="text-cyan-400">24時間ルール：</strong>
                    更新されないタスクは自動削除され、常にフレッシュな状態を保ちます。
                    ただし、各カテゴリの最優先タスクは時間無制限です。
                  </p>
                </div>
              </div>
            </section>

            {/* 4つのモード */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                <RotateCw className="w-6 h-6 text-blue-400" />
                4つのモード
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    作成モード
                  </h4>
                  <p className="text-sm text-gray-300">
                    思いついたタスクを素早く入力。Inboxに蓄積されます。
                  </p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-green-400 mb-1 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    分類モード
                  </h4>
                  <p className="text-sm text-gray-300">
                    Inboxのタスクを4つのカテゴリ（仕事・生活・学習・趣味）に振り分けます。
                  </p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-yellow-400 mb-1 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    一覧モード
                  </h4>
                  <p className="text-sm text-gray-300">
                    カテゴリごとにタスクを確認し、優先順位を調整します。
                  </p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-red-400 mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    実行モード
                  </h4>
                  <p className="text-sm text-gray-300">
                    各カテゴリの最優先タスクを表示。実行中のタスクを完了できます。
                  </p>
                </div>
              </div>
            </section>

            {/* デバイス別操作方法 */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                {isMobile ? (
                  <Smartphone className="w-6 h-6 text-purple-400" />
                ) : (
                  <Monitor className="w-6 h-6 text-purple-400" />
                )}
                {isMobile ? 'モバイル版の操作' : 'PC版の操作'}
              </h3>
              
              {isMobile ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">モード切替</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 左右にスワイプでモード切替</li>
                      <li>• 下部のナビゲーションバーでダイレクト選択</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">分類モード</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 4方向のボタンをタップでカテゴリ選択</li>
                      <li>• 上下左右にフリックでも分類可能</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">一覧モード</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• タスクをタップで最優先に設定</li>
                      <li>• 長押しでタスク削除</li>
                      <li>• ドラッグで順序変更・カテゴリ移動</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">実行モード</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 完了ボタンをタップでタスク完了</li>
                      <li>• 一時停止中のタスクをタップで実行開始</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">キーボードショートカット</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tab</span>
                          <span className="text-gray-300">次のモードへ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Shift+Tab</span>
                          <span className="text-gray-300">前のモードへ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Enter</span>
                          <span className="text-gray-300">タスク追加</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">W/↑</span>
                          <span className="text-gray-300">学習に分類</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">A/←</span>
                          <span className="text-gray-300">仕事に分類</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">S/↓</span>
                          <span className="text-gray-300">趣味に分類</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">D/→</span>
                          <span className="text-gray-300">生活に分類</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">実行モード</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 1〜4キー：対応するカテゴリのタスクを完了</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">マウス操作</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• ドラッグ＆ドロップで順序変更・カテゴリ移動</li>
                      <li>• 右クリックでタスク削除</li>
                      <li>• クリックで最優先設定・実行切替</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>

            {/* カテゴリ説明 */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-green-400" />
                4つのカテゴリ
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-sky-800/30 to-sky-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(categoryIcons.work.icon, { className: "w-5 h-5 text-sky-400" })}
                    <span className="font-medium text-gray-100">{categoryIcons.work.label}</span>
                  </div>
                  <p className="text-xs text-gray-300">職場や業務関連のタスク</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-teal-800/30 to-teal-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(categoryIcons.life.icon, { className: "w-5 h-5 text-teal-400" })}
                    <span className="font-medium text-gray-100">{categoryIcons.life.label}</span>
                  </div>
                  <p className="text-xs text-gray-300">日常生活や家事のタスク</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-violet-800/30 to-violet-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(categoryIcons.study.icon, { className: "w-5 h-5 text-violet-400" })}
                    <span className="font-medium text-gray-100">{categoryIcons.study.label}</span>
                  </div>
                  <p className="text-xs text-gray-300">勉強や自己成長のタスク</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-pink-800/30 to-pink-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(categoryIcons.hobby.icon, { className: "w-5 h-5 text-pink-400" })}
                    <span className="font-medium text-gray-100">{categoryIcons.hobby.label}</span>
                  </div>
                  <p className="text-xs text-gray-300">余暇や娯楽のタスク</p>
                </div>
              </div>
            </section>

            {/* Tips */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                使いこなしのコツ
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>思いついたらすぐに作成モードで入力する習慣をつけましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>各カテゴリで最も重要な1つを最優先に設定しましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <Flame className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>実行中タスクは全体で1つだけ。集中して取り組みましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>24時間ルールがあるので、毎日アプリを開く習慣が大切です</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>完了したタスクは次のタスクが自動で繰り上がります</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up-center {
          from { 
            opacity: 0;
          }
          to { 
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-slide-up-center {
          animation: slide-up-center 0.3s ease-out;
        }
      `}</style>
    </>
  )
}