import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET;

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

  const signIn = useCallback(async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "scratch",
        path: "auth/callback",
      });

      const request = new AuthSession.AuthRequest({
        clientId: GITHUB_CLIENT_ID!,
        scopes: ["gist", "user:email"],
        redirectUri,
        usePKCE: true,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === "success") {
        const { code, codeVerifier } = result.params;

        const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

        if (tokenResponse.access_token) {
          const user = await fetchUserProfile(tokenResponse.access_token);

          await AsyncStorage.setItem(
            "github_token",
            tokenResponse.access_token,
          );
          await AsyncStorage.setItem("github_user", JSON.stringify(user));

          setAuthState({
            user,
            token: tokenResponse.access_token,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      throw error;
    }
  }, []);

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

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    return response.json();
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
    }),
    [authState, signIn, signOut, refreshToken],
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
