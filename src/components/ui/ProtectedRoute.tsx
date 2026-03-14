import { Navigate, Outlet } from "react-router-dom"
import { Center, Spinner } from "@chakra-ui/react"
import { useAuthContext } from "@/context/AuthContext"

export default function ProtectedRoute() {
  const { currentUser, authLoading } = useAuthContext()

  if (authLoading) {
    return (
      <Center flex="1" h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
