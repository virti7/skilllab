import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export function AppLayout({ children, rightPanel }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-8 overflow-auto">{children}</main>
          {rightPanel && (
            <aside className="w-80 min-h-0 border-l border-border bg-card p-6 hidden lg:block overflow-auto">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
