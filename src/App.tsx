import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext"; // Add this import
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DeviceList from "./pages/DeviceList";
import DeviceDetail from "./pages/DeviceDetail";
import NotFound from "./pages/NotFound";
import DashboardView from "./pages/DashboardView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      {" "}
      {/* Add this wrapper */}
      <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices" element={<DeviceList />} />
              <Route path="/devices/:deviceId" element={<DeviceDetail />} />
              <Route path="*" element={<NotFound />} />
              <Route
                path="/dashboard/:dashboardId"
                element={<DashboardView />}
              />

            </Routes>
          </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>{" "}
    {/* Close wrapper */}
  </QueryClientProvider>
);

export default App;
