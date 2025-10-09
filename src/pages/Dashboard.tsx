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
  lastSeen: string;
  location: string;
  telemetry: {
    temperature?: number;
    humidity?: number;
    voltage?: number;
  };
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

  useEffect(() => {
    // Check if user has valid JWT token
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

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
  // Clear all stored data
  localStorage.removeItem("token");
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

//   const fetchUserData = async () => {
//     try {
//       console.log("Fetching user's dashboards and devices...");

//       // All API calls now use JWT token automatically
//       const [dashboardsResult, devicesResult] = await Promise.all([
//         api.getMyDashboards(),
//         api.getMyDevices(),
//       ]);

//       console.log("Dashboards result:", dashboardsResult);
//       console.log("Devices result:", devicesResult);

//       // Transform dashboards data
//       if (dashboardsResult.data) {
//         const transformedDashboards: CustomerDashboard[] =
//           dashboardsResult.data.map((dash: any) => ({
//             id: dash.id.id,
//             name: dash.title,
//             description: "ThingsBoard Dashboard",
//             deviceCount: devicesResult.totalElements || 0,
//             lastUpdated: "Just now",
//           }));
//         setDashboards(transformedDashboards);
//       }

//       // Transform and fetch telemetry for devices
//       if (devicesResult.data) {
//         const devicesWithTelemetry: CustomerDevice[] = [];

//         console.log(`Processing ${devicesResult.data.length} devices...`);

//         for (const deviceInfo of devicesResult.data) {
//           try {
//             console.log(
//               `Fetching telemetry for device: ${deviceInfo.name} (${deviceInfo.id.id})`
//             );

//  const telemetryResult = await api.getDeviceLiveData(
//    deviceInfo.id.id,
//    undefined,
//    30
//  );
//             console.log(`Telemetry for ${deviceInfo.name}:`, telemetryResult);

//             const transformedDevice: CustomerDevice = {
//               id: deviceInfo.id.id,
//               name: deviceInfo.name,
//               type: deviceInfo.type,
//               status: deviceInfo.active ? "online" : "offline",
//               lastSeen: deviceInfo.createdTime
//                 ? formatRelativeTime(deviceInfo.createdTime)
//                 : "Unknown",
//               location: deviceInfo.customerTitle || "No location set",
//               telemetry: {
//                 temperature: telemetryResult.telemetry?.temperature?.value,
//                 humidity: telemetryResult.telemetry?.humidity?.value,
//                 voltage:
//                   telemetryResult.telemetry?.voltage?.value ||
//                   telemetryResult.telemetry?.['"Voltage V1N"']?.value,
//               },
//             };

//             // Set warning status if device has no recent telemetry
//             // if (
//             //   !telemetryResult.telemetry ||
//             //   Object.keys(telemetryResult.telemetry).length === 0
//             // ) {
//             //   transformedDevice.status = "warning";
//             // }

//             devicesWithTelemetry.push(transformedDevice);
//             console.log("Transformed device:", transformedDevice);
//           } catch (telemetryError) {
//             console.error(
//               `Telemetry fetch failed for ${deviceInfo.name}:`,
//               telemetryError
//             );

//             // Add device without telemetry data
//             const transformedDevice: CustomerDevice = {
//               id: deviceInfo.id.id,
//               name: deviceInfo.name,
//               type: deviceInfo.type,
//               status: "warning",
//               lastSeen: "No telemetry data",
//               location: deviceInfo.customerTitle || "No location set",
//               telemetry: {},
//             };
//             devicesWithTelemetry.push(transformedDevice);
//           }
//         }

//         setDevices(devicesWithTelemetry);
//         console.log("Final devices state:", devicesWithTelemetry);

// if (devicesWithTelemetry.length === 0) {
//   toast({
//     title: "No Devices Found",
//     description: "No devices found for your account.",
//     variant: "destructive",
//     duration: 2000,
//   });
// }
//       }
//     } catch (error) {
//       console.error("User data fetch error:", error);

//       // Check if it's an authentication error
//       if (
//         error instanceof Error &&
//         error.message.includes("Authentication expired")
//       ) {
//         handleLogout();
//         return;
//       }

//       toast({
//         title: "API Error",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Failed to fetch data from ThingsBoard",
//         variant: "destructive",
//         duration: 2000,
//       });
//     }
//   };

  
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
          const live = await api.getDeviceLiveData(
            deviceInfo.id.id,
            undefined,
            30
          );
          console.log(`Live for ${deviceInfo.name}:`, live);

          const liveData: Record<
            string,
            { value: any; timestamp: number; isLive?: boolean }
          > = live?.data || {};

          // derive online/offline from live response
          const isOnline = !!(live?.isLive || (live?.dataCount ?? 0) > 0);

          // newest telemetry timestamp -> last seen
          const lastTs = Object.values(liveData).reduce(
            (max, d) => (d?.timestamp && d.timestamp > max ? d.timestamp : max),
            0
          );
          const lastSeenText =
            lastTs > 0 ? formatRelativeTime(lastTs) : "No telemetry";

          // helper to extract preview values by fuzzy key
          const pick = (...needles: string[]) => {
            const key = Object.keys(liveData).find((k) =>
              needles.every((n) => k.toLowerCase().includes(n))
            );
            if (!key) return undefined;
            const v = liveData[key]?.value;
            return typeof v === "number" ? v : Number(v);
          };

          const transformedDevice: CustomerDevice = {
            id: deviceInfo.id.id,
            name: deviceInfo.name,
            type: deviceInfo.type,
            status: isOnline ? "online" : "offline",
            lastSeen: lastSeenText,
            location: deviceInfo.customerTitle || "No location set",
            telemetry: {
              temperature: pick("temp"),
              humidity: pick("humid"),
              voltage: pick("voltage", "v1n") ?? pick("voltage"),
            },
          };

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
            lastSeen: "No telemetry",
            location: deviceInfo.customerTitle || "No location set",
            telemetry: {},
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
              Welcome, {user?.firstName || user?.email}!
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="default">Authenticated</Badge>
            </div>
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
                  No devices are currently available for your account. Make sure
                  your devices are properly configured and assigned in
                  ThingsBoard.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {devices.slice(0, 6).map((device) => (
                <Card
                  key={device.id}
                  className="telemetry-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/devices/${device.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {device.name}
                        </CardTitle>
                        <CardDescription>{device.type}</CardDescription>
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
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">
                          {device.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Last Seen:
                        </span>
                        <span className="text-foreground">
                          {device.lastSeen}
                        </span>
                      </div>

                      {/* Display available telemetry */}
                      <div className="flex flex-wrap gap-2">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;


