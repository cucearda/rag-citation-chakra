import { Outlet } from "react-router-dom";
import { Flex, Center } from "@chakra-ui/react";
import Navbar from "@/components/ui/Navbar";
import SignupForm from "@/components/ui/loginComponents/SignupForm";

export default function SignupLayout() {
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Center flex="1">
        <SignupForm />
      </Center>
      <Outlet />
    </Flex>
  );
}
