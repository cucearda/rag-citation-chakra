import './App.css'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import LoginLayout from './layouts/login-layout'

// router and routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<RootLayout />}></Route>
      <Route path="/login" element={<LoginLayout/>}></Route>
    </>
  )
)

function App() {
  return (
    <RouterProvider router={router}/>
  )
}

export default App
