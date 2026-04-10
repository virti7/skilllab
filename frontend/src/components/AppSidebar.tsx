import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Trophy,
  Settings,
  GraduationCap,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  User,
  Layers,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface MenuItem {
  title: string;
  icon: typeof LayoutDashboard;
  path: string;
}

const menusByRole: Record<UserRole, MenuItem[]> = {
  super_admin: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/super-admin" },
    { title: "Institutes", icon: Building2, path: "/super-admin/institutes" },
    { title: "Users", icon: Users, path: "/super-admin/users" },
    { title: "Subscriptions", icon: CreditCard, path: "/super-admin/subscriptions" },
  ],
  admin: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { title: "Batches", icon: Layers, path: "/admin/batches" },
    { title: "Students", icon: Users, path: "/admin/students" },
    { title: "Tests", icon: FileText, path: "/admin/tests" },
    { title: "Leaderboard", icon: Trophy, path: "/admin/leaderboard" },
    { title: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  ],
  student: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/student" },
    { title: "My Courses", icon: BookOpen, path: "/student/tests" },
    { title: "Leaderboard", icon: Trophy, path: "/student/leaderboard" },
    { title: "Profile", icon: User, path: "/student/profile" },
  ],
};

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "student";
  const menuItems = menusByRole[role];

  return (
    <aside className="w-60 min-h-screen bg-card border-r border-border flex flex-col py-6 px-4">
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">SkillLab</h1>
          <p className="text-xs text-muted-foreground">Workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.title}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-active-bg text-sidebar-active"
                  : "text-sidebar-foreground hover:bg-sidebar-hover"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
