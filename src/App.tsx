import { useState } from 'react'
import './App.css'
import { 
  createBrowserRouter, 
  createRoutesFromElements, 
  Route, 
  RouterProvider 
} from 'react-router-dom'
import RootLayout from './layouts/root-layout'

// router and routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}></Route>
  )
)

function App() {
  return (
    <RouterProvider router={router}/>
  )
}

export default App
