import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateMode } from '@/features/create'
import { useTasksStore } from '@/store/tasksStore'
import { resetStores } from '@/test/stores'

/** 作成モードの操作を検証する。 */
describe('CreateMode', () => {
  beforeEach(() => {
    resetStores()
  })

  const inbox = () => useTasksStore.getState().lists.inbox

  it('default: 空のときは大きな入力欄が出る', () => {
    render(<CreateMode />)
    expect(screen.getByPlaceholderText('今日やりたいことは？')).toBeInTheDocument()
  })

  context('when Enter で送信する', () => {
    it('inbox に追加される', async () => {
      render(<CreateMode />)
      await userEvent.type(screen.getByPlaceholderText('今日やりたいことは？'), '牛乳を買う{Enter}')
      expect(inbox()).toMatchObject([{ title: '牛乳を買う', category: 'inbox', status: 'active' }])
    })

    it('1件目を追加すると入力欄がチャット形式に変わる', async () => {
      render(<CreateMode />)
      await userEvent.type(screen.getByPlaceholderText('今日やりたいことは？'), 'タスク{Enter}')
      expect(screen.getByPlaceholderText('新しいタスクを追加...')).toBeInTheDocument()
    })
  })

  context('when 空白だけで送信する', () => {
    it('追加されない', async () => {
      render(<CreateMode />)
      await userEvent.type(screen.getByPlaceholderText('今日やりたいことは？'), '   {Enter}')
      expect(inbox()).toEqual([])
    })
  })

  context('when Shift+Enter を押す', () => {
    it('送信されない（改行として扱う）', async () => {
      render(<CreateMode />)
      await userEvent.type(screen.getByPlaceholderText('今日やりたいことは？'), 'まだ送らない{Shift>}{Enter}{/Shift}')
      expect(inbox()).toEqual([])
    })
  })

  context('with 既存タスクがある', () => {
    beforeEach(() => {
      useTasksStore.getState().actions.addTask('既存のタスク')
    })

    it('一覧に表示される', () => {
      render(<CreateMode />)
      expect(screen.getByText('既存のタスク')).toBeInTheDocument()
    })

    it('続けて追加すると末尾に並ぶ', async () => {
      render(<CreateMode />)
      await userEvent.type(screen.getByPlaceholderText('新しいタスクを追加...'), '2つ目{Enter}')
      expect(inbox().map(task => task.title)).toEqual(['既存のタスク', '2つ目'])
    })
  })
})
