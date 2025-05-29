import { Route, Routes } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import SignIn from './components/SignIn'
import HomePage from './pages/HomePage'

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="bg-black">
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  )
}

export default App
