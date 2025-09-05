import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {  
  Cpu, 
  Zap,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useNavigate } from "react-router-dom";

const navigationItems = [
  { title: "Devices", url: "/devices", icon: Cpu },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/")

  return (
    <Sidebar
      className={`${
        collapsed ? "w-14" : "w-64"
      } border-r border-sidebar-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 p-6 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title="Go to Dashboard"
        >
          {/* <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">
                Yeti Insight
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Industrial IoT
              </p>
            </div>
          )} */}

          {/* Replace the Zap icon with your Yeti logo */}
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
              {/* <h1 className="font-bold text-lg text-sidebar-foreground">
                Yeti Insight
              </h1> */}
              <p className="text-xs text-sidebar-foreground/60">
                Industrial IoT
              </p>
            </div>
          )}

        </div>

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
                        `sidebar-nav-item ${isActive ? "active" : ""}`
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

        {/* Status indicator */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="status-indicator bg-success animate-pulse"></div>
            {!collapsed && (
              <span className="text-xs text-sidebar-foreground/60">
                System Online
              </span>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}