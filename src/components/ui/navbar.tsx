import { Flex, Heading, Button, Spacer, HStack } from "@chakra-ui/react";

export default function Navbar() {
  return (
    <Flex as="nav" p="0px" alignItems="center" borderBottom="1px solid" borderColor="gray.300" boxShadow="md">
      <Heading margin="9px" as="h1">Rag Citator</Heading>
      <Spacer />

      <HStack gap="10px">
        <Button variant="plain" fontWeight="bold">Login</Button>
        <Button colorPalette="green" fontWeight="bold">Sign up</Button>
      </HStack>
    </Flex>
  );
}
