import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { completeAuth, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback triggered with params:", params);
        console.log(
          "Platform:",
          typeof window !== "undefined" ? "web" : "native",
        );

        // Wait for auth context to be ready
        if (isLoading || !isMounted.current) {
          console.log("Waiting for auth context or component not mounted");
          return;
        }

        if (params.code) {
          // Retrieve the stored code verifier
          console.log("Looking for code verifier in AsyncStorage...");
          const storedCodeVerifier =
            await AsyncStorage.getItem("pkce_code_verifier");

          console.log(
            "Stored code verifier:",
            storedCodeVerifier ? "Found" : "Not found",
          );

          if (storedCodeVerifier) {
            console.log("Using PKCE flow with code verifier");
          } else {
            console.log("No code verifier found, falling back to non-PKCE flow");
          }

          // Complete the auth flow with the received code and optional verifier
          await completeAuth(params.code as string, storedCodeVerifier);
          // Clean up the stored verifier
          await AsyncStorage.removeItem("pkce_code_verifier");

          console.log("Auth completed successfully");
          // Navigate to home page
          if (isMounted.current) {
            router.replace("/");
          }
        } else if (params.error) {
          console.error("OAuth error:", params.error);
          setError(`OAuth error: ${params.error}`);
          if (isMounted.current) {
            setIsProcessing(false);
          }
        } else {
          console.error("No code or error parameter in callback");
          setError("Invalid callback response. Please try signing in again.");
          if (isMounted.current) {
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError(
          `Authentication error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        if (isMounted.current) {
          setIsProcessing(false);
        }
      }
    };

    if (!isLoading) {
      handleCallback();
    }
  }, [params, completeAuth, isLoading, router]);

  if (isProcessing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Completing authentication...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#d32f2f",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
        <Text
          style={{ fontSize: 14, color: "#007AFF", marginBottom: 8 }}
          onPress={() => router.replace("/")}
        >
          Go back to sign in
        </Text>
      </View>
    );
  }

  return null;
}
