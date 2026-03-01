import { Outlet } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import CompleteWorkstation from "@/components/ui/CompleteWorkstation";


export default function LoginLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />
      <CompleteWorkstation/>
      <Outlet />
    </div>  )
}
