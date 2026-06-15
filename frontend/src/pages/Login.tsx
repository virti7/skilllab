import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { AuthLayout, RoleSelector, LoginForm, RegisterForm } from "@/components/auth";
import type { AuthRole, RegisterData } from "@/components/auth";

type Tab = "signin" | "register";

const roleToPath: Record<string, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  student: "/student",
};

export default function Login() {
  const { loginWithCredentials, registerUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("signin");
  const [selectedRole, setSelectedRole] = useState<AuthRole>("student");

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const result = await loginWithCredentials(email, password);
      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }
      const path = roleToPath[selectedRole] || "/student";
      navigate(path);
    },
    [loginWithCredentials, navigate, selectedRole]
  );

  const handleRegister = useCallback(
    async (data: RegisterData) => {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: selectedRole,
        mobile: data.mobile,
        instituteName: selectedRole === "admin" ? data.instituteName : undefined,
      });
      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }
      const path = roleToPath[selectedRole] || "/student";
      navigate(path);
    },
    [registerUser, navigate, selectedRole]
  );

  const handleForgotPassword = () => {
    // TODO: implement forgot password flow
  };

  return (
    <AuthLayout>
      <div className="space-y-4">
        {/* Role Selection */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Select your role
          </p>
          <RoleSelector selected={selectedRole} onSelect={setSelectedRole} />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-orange-50/50 rounded-lg p-0.5 border border-orange-100/50">
          {(["signin", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                tab === t
                  ? "bg-white text-foreground shadow-sm shadow-orange-500/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "signin" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          {tab === "signin" ? (
            <LoginForm
              key="login"
              onSubmit={handleLogin}
              onForgotPassword={handleForgotPassword}
            />
          ) : (
            <RegisterForm
              key={`register-${selectedRole}`}
              role={selectedRole}
              onSubmit={handleRegister}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
