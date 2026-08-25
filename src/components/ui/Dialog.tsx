import { X } from 'lucide-react'
import { Dialog as RadixDialog } from 'radix-ui'
import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

/**
 * モーダルダイアログ。Radix Dialog の薄いラッパー。
 *
 * フォーカストラップ、ESC で閉じる、背景クリックで閉じる、背景のスクロール固定、
 * `role="dialog"` / `aria-modal` / `aria-labelledby` の付与はすべて Radix が担当する。
 *
 * **常時ダークテーマなので配色は直接クラスで書く**（shadcn のような CSS 変数によるテーマ切り替えは持たない）。
 * 中央寄せは `inset-0 + m-auto` で行い transform を使わない。アニメーション側の translate と競合させないため。
 */
export const Dialog = ({ open, onOpenChange, title, children }: DialogProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <RadixDialog.Content
        // Description を持たないので aria-describedby を明示的に外す（Radix の警告対策）
        aria-describedby={undefined}
        className="fixed z-50 inset-x-4 inset-y-12 flex flex-col overflow-hidden rounded-2xl bg-gray-800 shadow-2xl animate-slide-up md:inset-0 md:m-auto md:h-fit md:max-h-[85vh] md:w-[90%] md:max-w-3xl"
      >
        <div className="flex shrink-0 items-center justify-between bg-linear-to-r from-violet-800 to-cyan-800 px-6 py-4">
          <RadixDialog.Title className="text-xl font-bold text-white">{title}</RadixDialog.Title>
          <RadixDialog.Close aria-label="閉じる" className="text-white/80 transition-colors hover:text-white">
            <X className="h-6 w-6" />
          </RadixDialog.Close>
        </div>
        <div className="space-y-8 overflow-y-auto px-6 py-6">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>
)
