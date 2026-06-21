import './App.css'
import AppRoutes from './Routes/AppRoutes'
import { UserProvider } from './Context/UserContext'

function App() {

  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App
