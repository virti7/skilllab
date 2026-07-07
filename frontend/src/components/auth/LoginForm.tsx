import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Chrome, LogIn } from "lucide-react";

interface LoginFormProps {
  onSubmit: (email: string, password: string, remember: boolean) => Promise<void>;
  onForgotPassword: () => void;
}

export function LoginForm({ onSubmit, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? "Please enter a valid email"
    : "";
  const passwordError = touched.password && password && password.length < 6
    ? "Password must be at least 6 characters"
    : "";

  const isValid = email && password && !emailError && !passwordError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit(email, password, remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="you@example.com"
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
              emailError ? "border-red-300 focus:border-red-400" : "border-border focus:border-primary"
            }`}
          />
        </div>
        {emailError && (
          <p className="text-[10px] text-red-500 mt-0.5 ml-1">{emailError}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="••••••••"
            className={`w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
              passwordError ? "border-red-300 focus:border-red-400" : "border-border focus:border-primary"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        {passwordError && (
          <p className="text-[10px] text-red-500 mt-0.5 ml-1">{passwordError}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <div
            onClick={() => setRemember(!remember)}
            className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              remember
                ? "bg-primary border-primary"
                : "border-muted-foreground/30 group-hover:border-primary/50"
            }`}
          >
            {remember && (
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            Remember me
          </span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
        >
          Forgot password?
        </button>
      </div>

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
            <LogIn className="w-3.5 h-3.5" />
          )}
          {loading ? "Signing in..." : "Sign In"}
        </span>
      </motion.button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-white text-xs font-medium text-foreground hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200"
        >
          <Chrome className="w-3.5 h-3.5" />
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-white text-xs font-medium text-foreground hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
          </svg>
          Microsoft
        </button>
      </div>
    </motion.form>
  );
}
