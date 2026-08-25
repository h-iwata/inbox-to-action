import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { AboutModal } from '@/components/AboutModal/AboutModal'

/**
 * Dialog との配線を検証する。
 * フォーカストラップ等の挙動そのものは Radix の責務なので、ここでは扱わない。
 */
describe('AboutModal', () => {
  let onClose: Mock<() => void>
  let isOpen: boolean
  const subject = () => render(<AboutModal isOpen={isOpen} onClose={onClose} />)

  beforeEach(() => {
    onClose = vi.fn<() => void>()
    isOpen = true
  })

  it('default: ダイアログとして開く', () => {
    subject()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('InboxToAction について')).toBeInTheDocument()
  })

  it('コンテンツが表示される', () => {
    subject()
    expect(screen.getByText('コンセプト')).toBeInTheDocument()
    expect(screen.getByText('4つのモード')).toBeInTheDocument()
  })

  context('with isOpen=false', () => {
    beforeEach(() => {
      isOpen = false
    })

    it('何も表示されない', () => {
      subject()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  context('when 閉じるボタンを押す', () => {
    it('onClose が呼ばれる', async () => {
      subject()
      await userEvent.click(screen.getByRole('button', { name: '閉じる' }))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  context('when ESC を押す', () => {
    it('onClose が呼ばれる', async () => {
      subject()
      await userEvent.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
