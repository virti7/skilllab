import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const roleBadge: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-card-purple text-foreground" },
  admin: { label: "Admin", className: "bg-card-orange text-foreground" },
  student: { label: "Student", className: "bg-card-blue text-foreground" },
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
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3" ref={ref}>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${badge.className}`}>{badge.label}</span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:bg-secondary rounded-xl px-2 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user.avatar}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline">{user.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute right-6 top-12 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
