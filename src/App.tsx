import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DeviceList from "./pages/DeviceList";
import DeviceDetail from "./pages/DeviceDetail";
import NotFound from "./pages/NotFound";
import DashboardView from "./pages/DashboardView";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard"; 
import { AdminRoute, PrivateRoute } from "./routes/guards";

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
            <Route path="/dashboard/:dashboardId" element={<DashboardView />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/admin" element={<AdminDashboard />} />
             */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <PrivateRoute>
                  <DeviceList />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>{" "}
    {/* Close wrapper */}
  </QueryClientProvider>
);

export default App;
