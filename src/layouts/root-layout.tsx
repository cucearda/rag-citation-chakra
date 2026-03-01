import { Outlet } from "react-router-dom"
import Navbar from "@/components/ui/Navbar"

export default function RootLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />
      <Outlet />
    </div>
  )
}
