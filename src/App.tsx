import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import ProjectLayout from './layouts/project-layout'
import LoginLayout from './layouts/login-layout'
import SignupLayout from './layouts/signup-layout'
import ConversationView from './components/ui/ConversationView'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/login', element: <LoginLayout /> },
  { path: '/signup', element: <SignupLayout /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: null },
          {
            path: 'projects/:projectId?',
            element: <ProjectLayout />,
            children: [{ index: true, element: <ConversationView /> }],
          },
        ],
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
