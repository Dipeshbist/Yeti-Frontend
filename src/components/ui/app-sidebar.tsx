import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Cpu, Zap, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isAdmin } from "@/utils/auth";

export function AppSidebar() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const currentPath = location.pathname;
  const isActive = (path: string) =>
    currentPath === path || currentPath.startsWith(path + "/");

 const baseItems = [{ title: "Devices", url: "/devices", icon: Cpu }];
 const adminItems = [{ title: "Admin Dashboard", url: "/admin", icon: Zap }];

 // ✅ Admin sees only Admin Dashboard; users see Devices
 const navigationItems = isAdmin() ? adminItems : baseItems;
  return (
    <Sidebar
      className={`${
        collapsed ? "w-14" : "w-64"
      } border-r border-sidebar-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* ✅ Header / Brand section */}
        <div
          onClick={() => navigate(isAdmin() ? "/admin" : "/dashboard")}
          className="flex items-center gap-3 p-6 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title="Go to Dashboard"
        >
          <div className="flex items-center justify-center">
            <img
              src="/yeti-logo.png"
              alt="Yeti Logo"
              className={`yeti-logo transition-all duration-300 ${
                collapsed ? "w-8 h-6" : "w-12 h-8"
              }`}
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">
                Insight
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Industrial IoT
              </p>
            </div>
          )}
        </div>

        {/* ✅ Navigation Menu */}
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium mb-4">
            {!collapsed && "NAVIGATION"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `sidebar-nav-item flex items-center gap-2 rounded-md px-2 py-1.5 ${
                          isActive
                            ? "bg-sidebar-accent text-accent-foreground"
                            : ""
                        } hover:bg-sidebar-accent transition-colors`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
