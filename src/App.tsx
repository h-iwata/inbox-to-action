import { useSelector } from 'react-redux'
import { RootState } from './store'

function App() {
  const currentMode = useSelector((state: RootState) => state.ui.currentMode)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">InboxToAction</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            現在のモード: <span className="font-semibold">{currentMode}</span>
          </p>
          <p className="text-gray-500 mt-4">
            プロジェクトの初期セットアップが完了しました。
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
