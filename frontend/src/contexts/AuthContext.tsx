import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, tokenStorage, AuthUser } from "@/lib/api";

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
    instituteName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  // Legacy mock login (kept for demo / super_admin fallback)
  login: (role: UserRole) => void;
}

const mockUsers: Record<string, User> = {
  super_admin: {
    id: "1",
    name: "Vikram Patel",
    email: "vikram@skilllab.io",
    role: "super_admin",
    avatar: "VP",
  },
};

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

  // On mount: restore session from token
  useEffect(() => {
    const token = tokenStorage.get();
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
        tokenStorage.remove();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const { token, user: apiUser } = await authApi.login(email, password);
      tokenStorage.set(token);
      setUser(apiUserToUser(apiUser));
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
      const { token, user: apiUser } = await authApi.register(data);
      tokenStorage.set(token);
      setUser(apiUserToUser(apiUser));
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Registration failed",
      };
    }
  };

  const logout = () => {
    tokenStorage.remove();
    setUser(null);
  };

  // Legacy mock login (kept for super_admin demo)
  const login = (role: UserRole) => {
    if (mockUsers[role]) setUser(mockUsers[role]);
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
        login,
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
