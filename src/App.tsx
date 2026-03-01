import './App.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import ProjectLayout from './layouts/project-layout'
import LoginLayout from './layouts/login-layout'
import SignupLayout from './layouts/signup-layout'
import CompleteWorkstation from './components/ui/CompleteWorkstation'
import { projects } from './data/mockProjects'

const router = createBrowserRouter([
  { path: '/login', element: <LoginLayout /> },
  { path: '/signup', element: <SignupLayout /> },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: projects.length > 0
          ? <Navigate to={`/projects/${projects[0].id}`} replace />
          : <Navigate to="/projects/empty" replace />
      },
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [{ index: true, element: <CompleteWorkstation /> }],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
