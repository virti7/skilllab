import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export function AppLayout({ children, rightPanel }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isMobile ? '' : 'lg:ml-64'}`}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
          {rightPanel && (
            <aside className="w-80 min-h-0 border-l border-border bg-card hidden xl:block overflow-auto">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
