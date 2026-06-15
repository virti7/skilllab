import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authApi,
  setTokens,
  getAccessToken,
  clearTokens,
  AuthUser,
} from "@/lib/api";

export type UserRole = "super_admin" | "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  institute?: string;
  instituteId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithCredentials: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    mobile?: string;
    instituteName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

function apiUserToUser(apiUser: AuthUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    avatar: apiUser.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    institute: apiUser.instituteName,
    instituteId: apiUser.instituteId,
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((apiUser) => {
        setUser(apiUserToUser(apiUser));
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(apiUserToUser(data.user));
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Login failed",
      };
    }
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    instituteName?: string;
  }) => {
    try {
      const result = await authApi.register(data);
      setTokens(result.accessToken, result.refreshToken);
      setUser(apiUserToUser(result.user));
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Registration failed",
      };
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithCredentials,
        registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
