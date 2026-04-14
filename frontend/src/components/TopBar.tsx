import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const roleBadge: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-card-purple/80 text-foreground" },
  admin: { label: "Admin", className: "bg-card-orange/80 text-foreground" },
  student: { label: "Student", className: "bg-card-blue/80 text-foreground" },
};

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;
  const badge = roleBadge[user.role];

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary">SkillLab</span>
      </div>
      <div className="flex items-center gap-3" ref={ref}>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${badge.className}`}>
          {badge.label}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:bg-secondary rounded-xl px-2 py-1.5 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
            {user.avatar}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline">{user.name}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-6 top-14 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl shadow-black/10 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
