import { Flex, Heading, Button, Spacer, HStack, Text } from "@chakra-ui/react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"

export default function Navbar() {
  const { currentUser, signOut } = useAuthContext()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate("/login")
  }

  return (
    <Flex as="nav" p="0px" alignItems="center" borderBottom="1px solid" borderColor="gray.300" boxShadow="md">
      <Heading margin="9px" as="h1">Rag Citator</Heading>
      <Spacer />

      <HStack gap="10px">
        {currentUser ? (
          <>
            <Text fontWeight="medium" fontSize="sm">{currentUser.email}</Text>
            <Button variant="plain" fontWeight="bold" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Link to="/login"><Button variant="plain" fontWeight="bold">Login</Button></Link>
            <Link to="/signup"><Button colorPalette="green" fontWeight="bold">Sign up</Button></Link>
          </>
        )}
      </HStack>
    </Flex>
  )
}
