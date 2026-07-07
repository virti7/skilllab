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
  FileText,
  X,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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
        { title: "Practice Sheets", icon: FileText, path: "/admin/practice-sheets" }
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

interface AppSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppSidebar({ open = false, onOpenChange }: AppSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const role = user?.role || "student";
  const menuSections = menusByRole[role];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigation = () => {
    if (isMobile && onOpenChange) {
      onOpenChange(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-foreground tracking-tight truncate">SkillLab</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Workspace</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => onOpenChange?.(false)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 md:px-3 no-scrollbar">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title || sectionIndex} className="mb-4 md:mb-6">
            {section.title && (
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-1.5 md:mb-2">
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
                    onClick={handleNavigation}
                    className={`
                      group flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium
                      transition-all duration-200 relative min-h-[44px]
                      ${isActive
                        ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 md:h-6 bg-primary rounded-r-full" />
                    )}
                    <item.icon
                      className={`
                        w-4 h-4 md:w-[18px] md:h-[18px] transition-all duration-200 shrink-0
                        ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                      `}
                    />
                    <span className={`truncate ${isActive ? "font-semibold" : ""}`}>{item.title}</span>
                    {isActive && (
                      <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-auto text-primary/60 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 md:p-3 border-t border-border">
        <Link
          to={role === "student" ? "/student/profile" : "#"}
          onClick={role !== "student" ? (e) => e.preventDefault() : handleNavigation}
          className="group flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 min-h-[44px]"
        >
          <Settings className="w-4 h-4 md:w-[18px] md:h-[18px] group-hover:rotate-45 transition-transform duration-300 shrink-0" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 min-h-[44px]"
        >
          <LogOut className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-card border-r border-border flex-col fixed left-0 top-0 bottom-0 z-40">
      {sidebarContent}
    </aside>
  );
}