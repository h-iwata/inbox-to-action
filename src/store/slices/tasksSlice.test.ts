import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import tasksReducer, { addTask, deleteTask, completeTask, classifyTask } from './tasksSlice'

describe('tasksSlice', () => {
  const createStore = () => {
    return configureStore({
      reducer: {
        tasks: tasksReducer,
      },
    })
  }

  describe('addTask', () => {
    it('should add a new task to inbox', () => {
      const store = createStore()
      const taskText = 'New test task'

      store.dispatch(addTask(taskText))

      const state = store.getState().tasks
      expect(state.lists.inbox).toHaveLength(1)
      expect(state.lists.inbox[0].title).toBe(taskText)
      expect(state.lists.inbox[0].category).toBe('inbox')
      expect(state.lists.inbox[0].status).toBe('active')
    })
  })

  describe('deleteTask', () => {
    it('should delete a task by id', () => {
      const store = createStore()
      store.dispatch(addTask('Task to delete'))
      const taskId = store.getState().tasks.lists.inbox[0].id

      store.dispatch(deleteTask(taskId))

      const state = store.getState().tasks
      expect(state.lists.inbox).toHaveLength(0)
    })

    it('should handle deleting non-existent task', () => {
      const store = createStore()
      store.dispatch(addTask('Task 1'))

      store.dispatch(deleteTask('non-existent-id'))

      const state = store.getState().tasks
      expect(state.lists.inbox).toHaveLength(1)
      expect(state.lists.inbox[0].title).toBe('Task 1')
    })
  })

  describe('completeTask', () => {
    it('should complete a task and move it to completed list', () => {
      const store = createStore()
      store.dispatch(addTask('Task to complete'))
      const taskId = store.getState().tasks.lists.inbox[0].id

      store.dispatch(completeTask(taskId))

      const state = store.getState().tasks
      expect(state.lists.inbox).toHaveLength(0)
      expect(state.completed).toHaveLength(1)
      expect(state.completed[0].status).toBe('done')
      expect(state.dailyStats.completed).toBe(1)
    })
  })

  describe('classifyTask', () => {
    it('should move task to specified category', () => {
      const store = createStore()
      store.dispatch(addTask('Task to classify'))
      const taskId = store.getState().tasks.lists.inbox[0].id

      store.dispatch(classifyTask({ id: taskId, category: 'work' }))

      const state = store.getState().tasks
      expect(state.lists.inbox).toHaveLength(0)
      expect(state.lists.work).toHaveLength(1)
      expect(state.lists.work[0].category).toBe('work')
    })

    it('should append tasks to category in insertion order', () => {
      const store = createStore()

      store.dispatch(addTask('Task 1'))
      store.dispatch(addTask('Task 2'))

      const [firstTask, secondTask] = store.getState().tasks.lists.inbox

      store.dispatch(classifyTask({ id: firstTask.id, category: 'work' }))
      store.dispatch(classifyTask({ id: secondTask.id, category: 'work' }))

      const state = store.getState().tasks
      expect(state.lists.work).toHaveLength(2)
      expect(state.lists.work[0].title).toBe('Task 1')
      expect(state.lists.work[1].title).toBe('Task 2')
    })
  })
})
