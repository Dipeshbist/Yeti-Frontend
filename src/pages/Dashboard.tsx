/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import {
  Cpu,
  Activity,
  Thermometer,
  Zap,
  TrendingUp,
  RefreshCw,
  Droplets,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api.ts"; 

interface CustomerDevice {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "warning";
  // lastSeen: string;
  location: string;
  // telemetry: {
  //   temperature?: number;
  //   humidity?: number;
  //   voltage?: number;
  // };
}

interface CustomerDashboard {
  id: string;
  name: string;
  description: string;
  deviceCount: number;
  lastUpdated: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  customerId: string;
}

const Dashboard = () => {
const handleRefresh = async () => {
  await initializeDashboard();
};
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [dashboards, setDashboards] = useState<CustomerDashboard[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    // Check if user has valid JWT token
const userData = localStorage.getItem("user");
let token = "";
if (userData) {
  const parsedUser = JSON.parse(userData);
  token =
    parsedUser.role === "admin"
      ? localStorage.getItem("adminToken") || ""
      : localStorage.getItem("token") || "";
}

    if (!token || !userData) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the dashboard",
        variant: "destructive",
        duration: 2000,
      });
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      initializeDashboard();
    } catch (error) {
      console.error("Invalid user data:", error);
      handleLogout();
    }
  }, [navigate]);

const handleLogout = () => {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  if (user?.role === "admin") {
    localStorage.removeItem("adminToken");
  } else {
    localStorage.removeItem("token");
  }

  localStorage.removeItem("user");
  localStorage.removeItem("customerId");

  navigate("/");
};


  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      // Verify token is still valid by getting user profile
      const profileResult = await api.getProfile();

      if (!profileResult.success) {
        throw new Error("Token expired or invalid");
      }

      // Fetch user's data using JWT-authenticated endpoints
      await fetchUserData();
    } catch (error) {
      console.error("Dashboard initialization error:", error);

      if (
        error instanceof Error &&
        error.message.includes("Authentication expired")
      ) {
        handleLogout();
        return;
      }

      toast({
        title: "Error",
        description: "Failed to initialize dashboard. Please try refreshing.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
const fetchUserData = async () => {
  try {
    console.log("Fetching user's dashboards and devices...");

    const [dashboardsResult, devicesResult] = await Promise.all([
      api.getMyDashboards(),
      api.getMyDevices(),
    ]);

    console.log("Dashboards result:", dashboardsResult);
    console.log("Devices result:", devicesResult);

    // Dashboards card meta
    if (dashboardsResult?.data) {
      const total =
        (devicesResult && "totalElements" in devicesResult
          ? (devicesResult as any).totalElements
          : devicesResult?.data?.length) || 0;

      const transformedDashboards: CustomerDashboard[] =
        dashboardsResult.data.map((dash: any) => ({
          id: dash.id.id,
          name: dash.title,
          description: "ThingsBoard Dashboard",
          deviceCount: total,
          lastUpdated: "Just now",
        }));
      setDashboards(transformedDashboards);
    }

    // Devices list with ONLINE/OFFLINE + LAST SEEN from live data
    if (devicesResult?.data) {
      const devicesWithTelemetry: CustomerDevice[] = [];

      for (const deviceInfo of devicesResult.data) {
        try {
const live = await api.getDeviceLiveData(deviceInfo.id.id, undefined, 30);
console.log(`Live for ${deviceInfo.name}:`, live);

// ✅ Detect online devices (support new grouped format)
let isOnline = false;

if (live?.groups && Object.keys(live.groups).length > 0) {
  // Count total keys across all groups
  const totalKeys = Object.values(live.groups).reduce<number>(
    (sum, group) => sum + Object.keys(group).length,
    0
  );
  isOnline = totalKeys > 0;
} else if (live?.data && Object.keys(live.data).length > 0) {
  // fallback for older format
  isOnline = true;
} else if (live?.isLive || (live?.dataCount ?? 0) > 0) {
  // very old fallback
  isOnline = true;
}
          const pick = (...needles: string[]) => {
            const data = live.groups || live.data || {};
            const key = Object.keys(data).find((k) =>
              needles.every((n) => k.toLowerCase().includes(n))
            );
            if (!key) return undefined;
            const v = data[key]?.value;
            return typeof v === "number" ? v : Number(v);
          };

          const transformedDevice: CustomerDevice = {
            id: deviceInfo.id.id,
            name: deviceInfo.name,
            type: deviceInfo.type,
            status: isOnline ? "online" : "offline",
            // lastSeen: lastSeenText,
            location: "Loading",
            // telemetry: {
            //   temperature: pick("temp"),
            //   humidity: pick("humid"),
            //   voltage: pick("voltage", "v1n") ?? pick("voltage"),
            // },
          };
          // ✅ Fetch user-entered location from your backend
          try {
            const locRes = await api.getDeviceLocation(deviceInfo.id.id);
            transformedDevice.location = locRes?.location || "Not set";
          } catch (err) {
            console.warn(`Failed to fetch location for ${deviceInfo.name}`);
            transformedDevice.location = "Not set";
          }
          devicesWithTelemetry.push(transformedDevice);
        } catch (telemetryError) {
          console.error(
            `Live fetch failed for ${deviceInfo.name}:`,
            telemetryError
          );
          // treat as offline if live fetch fails
          devicesWithTelemetry.push({
            id: deviceInfo.id.id,
            name: deviceInfo.name,
            type: deviceInfo.type,
            status: "offline",
            // lastSeen: "No telemetry",
            location: deviceInfo.customerTitle || "No location set",
            // telemetry: {},
          });
        }
      }

      setDevices(devicesWithTelemetry);
      console.log("Final devices state:", devicesWithTelemetry);
    }
  } catch (error) {
    console.error("User data fetch error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Authentication expired")
    ) {
      handleLogout();
      return;
    }

    toast({
      title: "API Error",
      description:
        error instanceof Error
          ? error.message
          : "Failed to fetch data from ThingsBoard",
      variant: "destructive",
      duration: 2000,
    });
  }
};


  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const handleViewDashboard = (dashboardId: string) => {
    navigate(`/dashboard/${dashboardId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "offline":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "warning":
        return "Warning";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };
  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;


  if (isLoading) {
    return (
      <AppLayout>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="industrial-card animate-pulse">
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Header with user info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Welcome, <br />
              {user?.firstName ? user.firstName.toUpperCase() : "USER"}
            </h1>

            {/* <div className="flex items-center gap-4 mt-2">
              <Badge variant="default">Authenticated</Badge>
            </div> */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:grid-cols-3">
          {/* Total */}
          <Card className="telemetry-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Devices
                  </p>
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    {devices.length}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online */}
          <Card className="telemetry-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Online Devices
                  </p>
                  <p className="text-lg font-bold text-success">
                    {onlineCount}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offline */}
          <Card className="telemetry-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Offline Devices
                  </p>
                  <p className="text-lg font-bold text-destructive">
                    {offlineCount}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Your Devices
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate("/devices")}
              className="gap-2"
            >
              <Cpu className="w-4 h-4" />
              View All Devices
            </Button>
          </div>

          {devices.length === 0 ? (
            <Card className="telemetry-card">
              <CardContent className="p-8 text-center">
                <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Devices Found</h3>
                <p className="text-muted-foreground mb-4">
                  No devices are currently available for your account.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {devices.slice(0, 6).map((device) => (
                <Card
                  key={device.id}
                  className="telemetry-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={async () => {
                    try {
                      const res = await api.getDeviceLocation(device.id);

                      if (res.location) {
                        // ✅ Location already exists → just open the device
                        navigate(`/devices/${device.id}`);
                      } else {
                   setSelectedDeviceId(device.id);
                   setLocationName("");
                   setIsLocationDialogOpen(true);

                      }
                    } catch (err) {
                      toast({
                        title: "Error",
                        description: "Unable to check or save location.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {device.name}
                        </CardTitle>
                        {/* <CardDescription>{device.type}</CardDescription> */}
                      </div>

                      {/* Status badge (top right) */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            device.status === "online"
                              ? "bg-success"
                              : "bg-destructive"
                          }`}
                        />
                        <Badge
                          variant={
                            device.status === "online"
                              ? "default"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">
                          {device.location}
                        </span>
                      </div> */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">
                          {device.location || "Not set"}
                        </span>
                      </div>

                      {/* Display available telemetry */}
                      {/* <div className="flex flex-wrap gap-2">
                        {device.telemetry.temperature !== undefined && (
                          <div className="flex items-center gap-1 text-sm">
                            <Thermometer className="w-3 h-3 text-accent" />
                            <span className="text-accent font-medium">
                              {device.telemetry.temperature.toFixed(1)}°C
                            </span>
                          </div>
                        )}

                        {device.telemetry.humidity !== undefined && (
                          <div className="flex items-center gap-1 text-sm">
                            <Droplets className="w-3 h-3 text-primary" />
                            <span className="text-primary font-medium">
                              {device.telemetry.humidity.toFixed(1)}%
                            </span>
                          </div>
                        )}

                        {device.telemetry.voltage !== undefined && (
                          <div className="flex items-center gap-1 text-sm">
                            <Zap className="w-3 h-3 text-warning" />
                            <span className="text-warning font-medium">
                              {device.telemetry.voltage.toFixed(1)}V
                            </span>
                          </div>
                        )}
                      </div> */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ Add Location Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <Input
              placeholder="Enter location name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLocationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!locationName.trim() || !selectedDeviceId) {
                  toast({
                    title: "Invalid Input",
                    description: "Please enter a valid location name.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  await api.saveDeviceLocation(
                    selectedDeviceId,
                    locationName.trim()
                  );
                  toast({
                    title: "Location Saved",
                    description: `Location set as "${locationName}" successfully.`,
                  });
                  setIsLocationDialogOpen(false);
                  await initializeDashboard(); // refresh list
                } catch (err) {
                  toast({
                    title: "Save Failed",
                    description: "Unable to save device location.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Dashboard;


