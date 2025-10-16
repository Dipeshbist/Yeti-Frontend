import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Button } from "@/components/ui/button";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { ReactNode } from "react";


interface AppLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export function AppLayout({ children, onRefresh }: AppLayoutProps) {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          {/* Top Header - Make responsive */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                {theme === "dark" ? (
                  <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
              <UserProfileDropdown />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}