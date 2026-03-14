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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithEmail, signInWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();
  const [activeProvider, setActiveProvider] = useState<"email" | "google" | null>(null);

  async function handleEmailLogin() {
    setActiveProvider("email");
    const user = await signInWithEmail(email, password);
    setActiveProvider(null);
    if (user) navigate("/");
  }

  async function handleGoogleLogin() {
    setActiveProvider("google");
    const user = await signInWithGoogle();
    setActiveProvider(null);
    if (user) navigate("/");
  }

  return (
    <Stack
      mb="2"
      justifyContent="center"
      alignItems="center"
      w="full"
      maxW="sm"
      gap="6"
    >
      <Heading color="teal.400">Welcome</Heading>

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

        {error && (
          <Text textStyle="sm" color="red.400">
            {error}
          </Text>
        )}

        <Button
          colorPalette="teal"
          w="full"
          size="lg"
          onClick={() => void handleEmailLogin()}
          loading={activeProvider === "email"}
          disabled={loading}
        >
          Sign In
        </Button>
      </Stack>

      <Stack direction="row" align="center" w="full">
        <Separator flex="1" />
        <Text textStyle="sm" color="fg.muted" whiteSpace="nowrap">
          or continue with
        </Text>
        <Separator flex="1" />
      </Stack>

      <Button
        variant="outline"
        w="full"
        size="lg"
        gap="3"
        onClick={() => void handleGoogleLogin()}
        loading={activeProvider === "google"}
        disabled={loading}
      >
        <FcGoogle size={20} />
        Sign in with Google
      </Button>

      <Text textStyle="sm" color="fg.muted">
        Do not have an account yet?{" "}
        <Link to="/signup">
          <Text as="span" color="teal.400" fontWeight="semibold">
            Sign up
          </Text>
        </Link>
      </Text>
    </Stack>
  );
}
