import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Separator,
  Stack,
  Text,
  defineStyle,
  useControllableState,
} from "@chakra-ui/react";
import type { InputProps } from "@chakra-ui/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";

interface FloatingLabelInputProps extends InputProps {
  label: string;
  onValueChange?: (value: string) => void;
}

const FloatingLabelInput = ({ label, onValueChange, ...rest }: FloatingLabelInputProps) => {
  const [inputState, setInputState] = useControllableState({ defaultValue: "" });
  const [focused, setFocused] = useState(false);
  const shouldFloat = inputState.length > 0 || focused;

  return (
    <Box pos="relative" w="full">
      <Input
        {...rest}
        onFocus={(e) => {
          rest.onFocus?.(e);
          setFocused(true);
        }}
        onBlur={(e) => {
          rest.onBlur?.(e);
          setFocused(false);
        }}
        onChange={(e) => {
          rest.onChange?.(e);
          setInputState(e.target.value);
          onValueChange?.(e.target.value);
        }}
        value={inputState}
        data-float={shouldFloat || undefined}
        pt="4"
      />
      <Field.Label css={floatingStyles} data-float={shouldFloat || undefined}>
        {label}
      </Field.Label>
    </Box>
  );
};

const floatingStyles = defineStyle({
  pos: "absolute",
  bg: "bg",
  px: "0.5",
  top: "2.5",
  insetStart: "3",
  fontWeight: "normal",
  pointerEvents: "none",
  transition: "all 0.15s ease",
  color: "fg.muted",
  fontSize: "md",
  "&[data-float]": {
    top: "-3",
    insetStart: "2",
    fontSize: "xs",
    color: "fg",
  },
});

export default function SignupForm() {
  const [_email, setEmail] = useState("");
  const [_password, setPassword] = useState("");
  const [_confirmPassword, setConfirmPassword] = useState("");

  return (
    <Stack
      flexDirection="column"
      mb="2"
      justifyContent="center"
      alignItems="center"
      w="full"
      maxW="sm"
      gap="6"
    >
      <Heading color="teal.400">Create Account</Heading>

      <Stack w="full" gap="5">
        <Field.Root>
          <FloatingLabelInput
            label="Email"
            type="email"
            onValueChange={setEmail}
          />
        </Field.Root>

        <Field.Root>
          <FloatingLabelInput
            label="Password"
            type="password"
            onValueChange={setPassword}
          />
        </Field.Root>

        <Field.Root>
          <FloatingLabelInput
            label="Confirm Password"
            type="password"
            onValueChange={setConfirmPassword}
          />
        </Field.Root>

        <Button colorPalette="teal" w="full" size="lg">
          Sign Up
        </Button>
      </Stack>

      <Stack direction="row" align="center" w="full">
        <Separator flex="1" />
        <Text textStyle="sm" color="fg.muted" whiteSpace="nowrap">
          or continue with
        </Text>
        <Separator flex="1" />
      </Stack>

      <Button variant="outline" w="full" size="lg" gap="3">
        <FcGoogle size={20} />
        Sign up with Google
      </Button>

      <Text textStyle="sm" color="fg.muted">
        Already have an account?{" "}
        <Link to="/login">
          <Text as="span" color="teal.400" fontWeight="semibold">
            Sign in
          </Text>
        </Link>
      </Text>
    </Stack>
  );
}
