import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// import * as Crypto from "expo-crypto";

interface User {
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  completeAuth: (code: string, codeVerifier?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET;
const GITHUB_OAUTH_PROXY_URL =
  process.env.EXPO_PUBLIC_GITHUB_OAUTH_PROXY_URL;

console.log(
  "Environment check - Client ID:",
  GITHUB_CLIENT_ID ? "Set" : "Not set",
);
console.log(
  "Environment check - Client Secret:",
  GITHUB_CLIENT_SECRET ? "Set" : "Not set",
);

const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
  revocationEndpoint:
    "https://github.com/settings/connections/applications/" + GITHUB_CLIENT_ID,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("github_token");
      const storedUser = await AsyncStorage.getItem("github_user");

      if (storedToken && storedUser) {
        setAuthState({
          user: JSON.parse(storedUser),
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const completeAuth = useCallback(
    async (code: string, codeVerifier?: string | null) => {
      console.log("completeAuth called with:", {
        code: code.substring(0, 10) + "...",
        codeVerifier: codeVerifier ? "Present" : "Missing",
      });

      try {
        const tokenResponse = codeVerifier
          ? await exchangeCodeForToken(code, codeVerifier)
          : await exchangeCodeForTokenWeb(code);

        if (tokenResponse.access_token) {
          console.log("Got access token, fetching user profile...");
          const user = await fetchUserProfile(tokenResponse.access_token);

          await AsyncStorage.setItem(
            "github_token",
            tokenResponse.access_token,
          );
          await AsyncStorage.setItem("github_user", JSON.stringify(user));

          console.log("Setting auth state to authenticated");
          setAuthState({
            user,
            token: tokenResponse.access_token,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          console.error("No access token in response:", tokenResponse);
        }
      } catch (error) {
        console.error("Error completing auth:", error);
        throw error;
      }
    },
    [],
  );

  const signIn = useCallback(async () => {
    try {
      console.log("Starting sign-in process...");

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "scratch",
        path: "auth/callback",
        preferLocalhost: true,
      });

      console.log("Generated redirect URI:", { redirectUri });
      console.log("Client ID:", GITHUB_CLIENT_ID);

      // Use the standard OAuth flow with AuthSession
      const request = new AuthSession.AuthRequest({
        clientId: GITHUB_CLIENT_ID!,
        scopes: ["gist", "user:email"],
        redirectUri,
        usePKCE: true,
      });

      console.log("AuthRequest created with PKCE enabled");

      if (request.codeVerifier) {
        await AsyncStorage.setItem(
          "pkce_code_verifier",
          request.codeVerifier,
        );
      }

      const result = await request.promptAsync(discovery);
      console.log("OAuth result:", result.type);

      if (result.type === "success") {
        console.log("Got authorization code, waiting for callback route");
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      throw error;
    }
  }, [completeAuth]);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["github_token", "github_user"]);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      if (!authState.token) return;

      const user = await fetchUserProfile(authState.token);
      setAuthState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error("Error refreshing token:", error);
      await signOut();
    }
  }, [authState.token, signOut]);

  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    console.log("Exchanging code for token...", {
      code: code.substring(0, 10) + "...",
      codeVerifier: codeVerifier ? "Present" : "Missing",
    });

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
        }),
      },
    );

    console.log("Token exchange response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", errorText);
      throw new Error(`Failed to exchange code for token: ${response.status}`);
    }

    const result = await response.json();
    console.log("Token exchange result:", result);
    return result;
  };

  const exchangeCodeForTokenWeb = async (code: string) => {
    console.log("Exchanging code for token (web, no PKCE)...", {
      code: code.substring(0, 10) + "...",
    });

    if (!GITHUB_OAUTH_PROXY_URL) {
      throw new Error(
        "Missing EXPO_PUBLIC_GITHUB_OAUTH_PROXY_URL. Web token exchange must go through your own backend to avoid CORS.",
      );
    }

    const response = await fetch(
      GITHUB_OAUTH_PROXY_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    console.log("Web token exchange response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Web token exchange failed:", errorText);
      throw new Error(`Failed to exchange code for token: ${response.status}`);
    }

    const result = await response.json();
    console.log("Web token exchange result:", result);
    return result;
  };

  const fetchUserProfile = async (token: string): Promise<User> => {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "ScratchApp",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const userData = await response.json();

    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "ScratchApp",
      },
    });

    const emails = await emailResponse.json();
    const primaryEmail =
      emails.find((email: any) => email.primary && email.verified)?.email ||
      userData.email;

    return {
      id: userData.id.toString(),
      login: userData.login,
      name: userData.name || userData.login,
      email: primaryEmail,
      avatar_url: userData.avatar_url,
    };
  };

  const value = useMemo(
    () => ({
      ...authState,
      signIn,
      signOut,
      refreshToken,
      completeAuth,
    }),
    [authState, signIn, signOut, refreshToken, completeAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
