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
  completeAuth: (code: string, codeVerifier: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET;

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
    async (code: string, codeVerifier: string) => {
      console.log("completeAuth called with:", {
        code: code.substring(0, 10) + "...",
        codeVerifier: codeVerifier ? "Present" : "Missing",
      });

      try {
        const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

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
        usePKCE: false, // Disable PKCE for web to avoid CORS issues
      });

      console.log("AuthRequest created, PKCE disabled for web");

      const result = await request.promptAsync(discovery);
      console.log("OAuth result:", result.type);

      if (result.type === "success") {
        const { code } = result.params;
        console.log("Got authorization code");

        // For web, we need to handle the token exchange differently
        // Let's use a simple approach that works in web browsers
        if (typeof window !== "undefined") {
          // Create a form to post to GitHub's token endpoint
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "https://github.com/login/oauth/access_token";
          form.style.display = "none";

          const clientIdInput = document.createElement("input");
          clientIdInput.type = "hidden";
          clientIdInput.name = "client_id";
          clientIdInput.value = GITHUB_CLIENT_ID!;
          form.appendChild(clientIdInput);

          const clientSecretInput = document.createElement("input");
          clientSecretInput.type = "hidden";
          clientSecretInput.name = "client_secret";
          clientSecretInput.value = GITHUB_CLIENT_SECRET!;
          form.appendChild(clientSecretInput);

          const codeInput = document.createElement("input");
          codeInput.type = "hidden";
          codeInput.name = "code";
          codeInput.value = code;
          form.appendChild(codeInput);

          // Create an iframe to handle the POST request
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.name = "oauth_frame";
          document.body.appendChild(iframe);

          form.target = "oauth_frame";
          document.body.appendChild(form);

          // Listen for the response
          return new Promise<void>((resolve, reject) => {
            iframe.onload = async () => {
              try {
                // Try to extract the token from the iframe response
                const iframeDoc =
                  iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc && iframeDoc.body.textContent) {
                  const responseText = iframeDoc.body.textContent;
                  const urlParams = new URLSearchParams(responseText);
                  const accessToken = urlParams.get("access_token");

                  if (accessToken) {
                    console.log("Got access token from iframe");
                    const user = await fetchUserProfile(accessToken);

                    await AsyncStorage.setItem("github_token", accessToken);
                    await AsyncStorage.setItem(
                      "github_user",
                      JSON.stringify(user),
                    );

                    setAuthState({
                      user,
                      token: accessToken,
                      isLoading: false,
                      isAuthenticated: true,
                    });

                    resolve();
                  } else {
                    reject(new Error("No access token in response"));
                  }
                } else {
                  reject(new Error("Could not read iframe response"));
                }
              } catch (error) {
                reject(error);
              } finally {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
              }
            };

            iframe.onerror = () => {
              document.body.removeChild(form);
              document.body.removeChild(iframe);
              reject(new Error("OAuth request failed"));
            };

            form.submit();
          });
        }
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
