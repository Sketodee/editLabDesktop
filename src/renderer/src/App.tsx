import { Route, Routes } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import SignIn from './components/SignIn'
import HomePage from './pages/HomePage'
import { ProtectedRoute } from './utils/ProtectedRoute'

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="bg-black">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </div>
  )
}

export default App
