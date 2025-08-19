import React, { useEffect } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { X, Lightbulb, RotateCw, PenTool, FolderOpen, List, Target, BarChart3, Sparkles, Flame, Calendar, Trophy } from 'lucide-react'
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
                  InboxToActionは、24時間でタスクが消える新感覚のやることリストです。
                </p>
                <p>
                  思いついたらメモして、4つのカテゴリに分けて、実行する。
                  忘れることで、本当に大切なものが分かります。
                </p>
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-sm">
                    <strong className="text-cyan-400">24時間ルール：</strong>
                    タスクは作成から24時間で自動削除されます。
                    消えたタスクを思い出すとき、その大切さに気づきます。
                    繰り返し書くことで、実行への意欲が育ちます。
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

            {/* レベルアップシステム */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                レベルアップシステム
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-yellow-400 mb-1">基本ルール</h4>
                  <ul className="space-y-1">
                    <li>• タスクを2つ完了するごとに1レベルアップ</li>
                    <li>• レベル5がMAX（10タスク完了で到達）</li>
                    <li>• 画面上部のプログレスバーで進捗を確認</li>
                  </ul>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-green-400 mb-1">達成メッセージ</h4>
                  <ul className="space-y-1">
                    <li>• 特定カテゴリに集中：「仕事の鬼と化しています」</li>
                    <li>• バランス良く完了：「見事な配分センス！」</li>
                    <li>• レベルMAX達成：「レジェンドランク到達！」</li>
                  </ul>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-bold text-purple-400 mb-1">カテゴリ別記録</h4>
                  <p>各カテゴリの完了数がアイコン下に表示され、どの分野に注力したかが一目でわかります。</p>
                </div>
              </div>
            </section>

            {/* カテゴリ説明 */}
            <section>
              <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-green-400" />
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
                  <span>24時間ルールで全タスクが削除されるので、毎日アプリを開く習慣が大切です</span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>タスク完了でレベルアップ！レベルMAXで今日を締めくくろう</span>
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