import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { GraduationCap, Shield, School, BookOpen, Loader2 } from "lucide-react";

type Tab = "login" | "register";

const roles: {
  role: string;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
}[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Platform owner — manage all institutes",
    icon: Shield,
    color: "bg-card-purple",
  },
  {
    role: "admin",
    label: "Admin",
    description: "Institute owner — manage students & tests",
    icon: School,
    color: "bg-card-orange",
  },
  {
    role: "student",
    label: "Student",
    description: "Learner — take tests & track progress",
    icon: BookOpen,
    color: "bg-card-blue",
  },
];

const roleToPath: Record<string, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  student: "/student",
};

export default function Login() {
  const { loginWithCredentials, registerUser, login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("login");
  const [selectedRole, setSelectedRole] = useState<string>("student");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    instituteName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  // Demo / Super Admin quick login (mock)
  const handleDemoLogin = (role: UserRole) => {
    if (role === "super_admin") {
      login(role);
      navigate("/super-admin");
    } else {
      setSelectedRole(role);
      setTab("login");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    const result = await loginWithCredentials(form.email, form.password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
      return;
    }
    const path = roleToPath[selectedRole] || "/student";
    navigate(path);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required");
      return;
    }
    if (selectedRole === "admin" && !form.instituteName) {
      setError("Institute name is required for admin registration");
      return;
    }
    setLoading(true);
    const result = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: selectedRole,
      instituteName: selectedRole === "admin" ? form.instituteName : undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Registration failed");
      return;
    }
    const path = roleToPath[selectedRole] || "/student";
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to SkillLab</h1>
          <p className="text-muted-foreground text-sm mt-2">Select a role to continue</p>
        </div>

        {/* Role cards */}
        <div className="space-y-4 mb-8">
          {roles.map((r) => (
            <button
              key={r.role}
              onClick={() => handleDemoLogin(r.role as UserRole)}
              className={`w-full flex items-center gap-4 p-5 bg-card rounded-2xl border transition-all text-left ${
                selectedRole === r.role && r.role !== "super_admin"
                  ? "border-primary/60 shadow-md"
                  : "border-border hover:border-primary/40 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center`}
              >
                <r.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{r.label}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Login / Register form (for admin & student) */}
        {selectedRole !== "super_admin" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
              {(["login", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-4">
              {tab === "register" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleField}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              )}

              {tab === "register" && selectedRole === "admin" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Institute Name
                  </label>
                  <input
                    name="instituteName"
                    type="text"
                    value={form.instituteName}
                    onChange={handleField}
                    placeholder="Your institute name"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleField}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleField}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {tab === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
