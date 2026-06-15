import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import type { AuthRole } from "./RoleSelector";

interface RegisterFormProps {
  role: AuthRole;
  onSubmit: (data: RegisterData) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  instituteName?: string;
  acceptTerms: boolean;
}

const passwordRequirements = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

function getStrength(password: string): { level: number; label: string; color: string } {
  const passed = passwordRequirements.filter((r) => r.test(password)).length;
  if (passed === 0) return { level: 0, label: "Very weak", color: "bg-red-500" };
  if (passed <= 2) return { level: 1, label: "Weak", color: "bg-orange-500" };
  if (passed === 3) return { level: 2, label: "Medium", color: "bg-yellow-500" };
  return { level: 3, label: "Strong", color: "bg-green-500" };
}

export function RegisterForm({ role, onSubmit }: RegisterFormProps) {
  const [form, setForm] = useState<RegisterData>({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    instituteName: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateField = (key: keyof RegisterData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const strength = getStrength(form.password);
  const passwordsMatch = form.password === form.confirmPassword;
  const isSuperAdmin = role === "super_admin";

  const isValid =
    form.name &&
    form.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.mobile &&
    form.mobile.length >= 10 &&
    form.password &&
    strength.level >= 2 &&
    passwordsMatch &&
    form.acceptTerms &&
    (role !== "admin" || form.instituteName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin) return;
    setTouched({
      name: true,
      email: true,
      mobile: true,
      password: true,
      confirmPassword: true,
      instituteName: role === "admin",
      acceptTerms: true,
    });
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit(form);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground mb-1">Account Created!</h3>
        <p className="text-muted-foreground text-xs max-w-xs">
          Welcome to SkillLab. Redirecting to your dashboard...
        </p>
      </motion.div>
    );
  }

  if (isSuperAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-8 text-center px-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
          <Shield className="w-7 h-7 text-purple-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Super Admin Registration
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
          Super admin accounts are created by the platform team. Please contact your
          administrator or email{" "}
          <span className="text-primary font-medium">admin@skilllab.io</span> to request access.
        </p>
      </motion.div>
    );
  }

  const renderField = (
    key: keyof RegisterData,
    label: string,
    type: string,
    placeholder: string,
    icon: typeof User,
    options?: {
      rightElement?: React.ReactNode;
      validation?: string;
    }
  ) => {
    const Icon = icon;
    const value = form[key] as string;
    const isTouched = touched[key];
    const showError = isTouched && !value;

    return (
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type={type}
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
            placeholder={placeholder}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
              showError ? "border-red-300" : "border-border focus:border-primary"
            }`}
          />
          {options?.rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {options.rightElement}
            </div>
          )}
        </div>
        {options?.validation && (
          <p className="text-[10px] text-red-500 mt-0.5 ml-1">{options.validation}</p>
        )}
      </div>
    );
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderField("name", "Full Name", "text", "Your full name", User)}
        {role === "admin" ? (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Institute Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={form.instituteName}
                onChange={(e) => updateField("instituteName", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, instituteName: true }))}
                placeholder="Your institute name"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  touched.instituteName && !form.instituteName
                    ? "border-red-300"
                    : "border-border focus:border-primary"
                }`}
              />
            </div>
          </div>
        ) : (
          renderField("mobile", "Mobile Number", "tel", "+1 234 567 890", Phone, {
            validation:
              touched.mobile && form.mobile && form.mobile.length < 10
                ? "Enter at least 10 digits"
                : undefined,
          })
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderField("email", "Email", "email", "you@example.com", Mail, {
          validation:
            touched.email && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
              ? "Invalid email address"
              : undefined,
        })}
        {role === "admin" ? (
          renderField("mobile", "Mobile Number", "tel", "+1 234 567 890", Phone, {
            validation:
              touched.mobile && form.mobile && form.mobile.length < 10
                ? "Enter at least 10 digits"
                : undefined,
          })
        ) : (
          <div />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-1.5 space-y-1">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < strength.level ? strength.color : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{strength.label}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {passwordRequirements.map((req, i) => {
                  const passed = req.test(form.password);
                  return (
                    <div key={i} className="flex items-center gap-1 text-[10px]">
                      {passed ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                      ) : (
                        <XCircle className="w-2.5 h-2.5 text-gray-300" />
                      )}
                      <span className={passed ? "text-green-600" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              placeholder="••••••••"
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                touched.confirmPassword && form.confirmPassword && !passwordsMatch
                  ? "border-red-300"
                  : "border-border focus:border-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {touched.confirmPassword && form.confirmPassword && !passwordsMatch && (
            <p className="text-[10px] text-red-500 mt-0.5 ml-1">Passwords do not match</p>
          )}
        </div>
      </div>

      <label className="flex items-start gap-2 cursor-pointer group">
        <div
          onClick={() => updateField("acceptTerms", !form.acceptTerms)}
          className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all duration-200 mt-0.5 ${
            form.acceptTerms
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 group-hover:border-primary/50"
          }`}
        >
          {form.acceptTerms && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
          I agree to the{" "}
          <button type="button" className="text-primary font-medium hover:underline">
            Terms of Service
          </button>{" "}
          and{" "}
          <button type="button" className="text-primary font-medium hover:underline">
            Privacy Policy
          </button>
        </span>
      </label>

      <motion.button
        type="submit"
        disabled={loading || !isValid}
        whileHover={!loading && isValid ? { scale: 1.01 } : {}}
        whileTap={!loading && isValid ? { scale: 0.99 } : {}}
        className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden group text-xs"
      >
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
          {loading ? "Creating account..." : "Create Account"}
        </span>
      </motion.button>
    </motion.form>
  );
}
