import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Settings,
  LogOut,
  GraduationCap,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Layers,
  ChevronRight,
  Code2,
  History,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface MenuItem {
  title: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menusByRole: Record<UserRole, MenuSection[]> = {
  super_admin: [
    {
      title: "Main",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, path: "/super-admin" },
        { title: "Institutes", icon: Building2, path: "/super-admin/institutes" },
        { title: "Users", icon: Users, path: "/super-admin/users" },
        { title: "Subscriptions", icon: CreditCard, path: "/super-admin/subscriptions" },
      ],
    },
  ],
  admin: [
    {
      title: "Main",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { title: "Batches", icon: Layers, path: "/admin/batches" },
        { title: "Students", icon: Users, path: "/admin/students" },
        { title: "Tests", icon: BookOpen, path: "/admin/tests" },
        { title: "Coding Lab", icon: Code2, path: "/admin/coding" },
      ],
    },
    {
      title: "Competitions",
      items: [
        { title: "Leaderboard", icon: Trophy, path: "/admin/leaderboard" },
        { title: "Analytics", icon: BarChart3, path: "/admin/analytics" },
      ],
    },
  ],
  student: [
    {
      title: "Main",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, path: "/student" },
        { title: "My Courses", icon: BookOpen, path: "/student/tests" },
        { title: "Test History", icon: History, path: "/student/test-history" },
        { title: "Coding Lab", icon: Code2, path: "/student/coding" },
      ],
    },
    {
      title: "Competitions",
      items: [
        { title: "Leaderboard", icon: Trophy, path: "/student/leaderboard" },
      ],
    },
    {
      title: "Account",
      items: [
        { title: "Profile", icon: User, path: "/student/profile" },
      ],
    },
  ],
};

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "student";
  const menuSections = menusByRole[role];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 bottom-0 z-40">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">SkillLab</h1>
            <p className="text-xs text-muted-foreground font-medium">Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title || sectionIndex} className="mb-6">
            {section.title && (
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200 relative
                      ${
                        isActive
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                    )}
                    <item.icon
                      className={`
                        w-[18px] h-[18px] transition-all duration-200
                        ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                      `}
                    />
                    <span className={`${isActive ? "font-semibold" : ""}`}>{item.title}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          to="/student/profile"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 mb-1"
        >
          <Settings className="w-[18px] h-[18px] group-hover:rotate-45 transition-transform duration-300" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
