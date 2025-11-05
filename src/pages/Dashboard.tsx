/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
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
import { useMemo } from "react";
import { DeviceMap } from "@/components/DeviceMap"; // you'll create this in Step 4
import { MapSearchBox } from "@/components/MapSearchBox";


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
  status: "online" | "offline";
  location: string;
  lat?: number | null; // NEW
  lng?: number | null; // NEW
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
// const handleRefresh = async () => {
//   await initializeDashboard();
// };
const [devices, setDevices] = useState<CustomerDevice[]>([]);
const [dashboards, setDashboards] = useState<CustomerDashboard[]>([]);
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);
const navigate = useNavigate();
const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | undefined>(
    undefined
  );
  const [showResults, setShowResults] = useState(false);
  let searchTimeout: number | undefined;

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
  
  const [filterStatus, setFilterStatus] = useState<
    "all" | "online" | "offline"
  >("all");

  const filteredDevices = useMemo(() => {
    if (filterStatus === "all") return devices;
    return devices.filter((d) => d.status === filterStatus);
  }, [devices, filterStatus]);


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
  

  const runGeocode = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      // Free OSM geocoder (rate-limited; fine for internal use)
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=5`
      );
      const data = await resp.json();
      setSearchResults(data || []);
      setShowResults(true);
    } catch (e) {
      setSearchResults([]);
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
          const live = await api.getDeviceLiveData(
            deviceInfo.id.id,
            undefined,
            30
          );
          console.log(`Live for ${deviceInfo.name}:`, live);

          // Detect online devices (support new grouped format)
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
            location: "Loading",
          };
          // Fetch user-entered location from your backend
          try {
            const locRes = await api.getDeviceLocation(deviceInfo.id.id);
            transformedDevice.location = locRes?.location || "Not set";
            transformedDevice.lat =
              typeof locRes?.lat === "number" ? locRes.lat : null;
            transformedDevice.lng =
              typeof locRes?.lng === "number" ? locRes.lng : null;
          } catch (err) {
            console.warn(`Failed to fetch location for ${deviceInfo.name}`);
            transformedDevice.location = "Not set";
            transformedDevice.lat = null;
            transformedDevice.lng = null;
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
           location: deviceInfo.customerTitle || "No location set",
           lat: null,
           lng: null,
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:grid-cols-3">
          {/* Total */}
          <Card
            className="telemetry-card cursor-pointer hover:bg-muted/50 transition"
            onClick={() => navigate("/devices")}
          >
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
          <Card
            className="telemetry-card cursor-pointer hover:bg-muted/50 transition"
            onClick={() => navigate("/devices?status=online")}
          >
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
          <Card
            className="telemetry-card cursor-pointer hover:bg-muted/50 transition"
            onClick={() => navigate("/devices?status=offline")}
          >
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

        {/* Map Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: Title + Chips */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground mr-2">
                Devices Map{" "}
                {filterStatus !== "all" && (
                  <span className="text-muted-foreground">
                    ({filterStatus})
                  </span>
                )}
              </h2>

              {/* Chips like Google categories */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => {
                    setFilterStatus("all");
                  }}
                >
                  All
                </Button>

                <Button
                  size="sm"
                  variant={filterStatus === "online" ? "default" : "outline"}
                  onClick={() => {
                    setFilterStatus("online");
                  }}
                >
                  Online
                </Button>

                <Button
                  size="sm"
                  variant={filterStatus === "offline" ? "default" : "outline"}
                  onClick={() => {
                    setFilterStatus("offline");
                  }}
                >
                  Offline
                </Button>

                {/* Go to device list with filter (like Google top chips -> list) */}
                {/* <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (filterStatus === "all") navigate("/devices");
                    else navigate(`/devices?status=${filterStatus}`);
                  }}
                >
                  Open List
                </Button> */}
              </div>
            </div>

            {/* Right: Search box (like Google Maps) */}
            {/* <div className="relative w-full md:w-96">
              <Input
                placeholder="Search location…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  window.clearTimeout(searchTimeout);
                  // debounce 300ms
                  // @ts-ignore
                  searchTimeout = window.setTimeout(
                    () => runGeocode(e.target.value),
                    300
                  );
                }}
                onFocus={() => searchQuery && setShowResults(true)}
                className="pr-2"
              />
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.lat}-${r.lon}-${i}`}
                      className="block w-full text-left px-2 py-1.5 hover:bg-muted rounded"
                      onClick={() => {
                        const latNum = Number(r.lat),
                          lonNum = Number(r.lon);
                        setFlyToCenter([latNum, lonNum]); // pan the map
                        setLat(latNum);
                        setLng(lonNum); // prefill Add Location dialog if needed
                        setLocationName(r.display_name || "");
                        setShowResults(false);
                      }}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div> */}
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
            <>
              <DeviceMap
                devices={filteredDevices}
                onMarkerClick={(id) => navigate(`/devices/${id}`)}
                flyToCenter={flyToCenter}
              />
              <div className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 mr-1 align-middle rounded-sm bg-green-500"></span>{" "}
                Online
                <span className="inline-block w-3 h-3 mx-2 align-middle rounded-sm bg-red-500"></span>{" "}
                Offline
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Location Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              placeholder="Location label (e.g., Office)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full"
            />

            {/* 🔍 OpenStreetMap Search */}
            <MapSearchBox
              onSelect={(latVal, lonVal, name) => {
                setLat(latVal);
                setLng(lonVal);
                setLocationName(name);
                toast({
                  title: "Location selected",
                  description: `Lat: ${latVal.toFixed(
                    5
                  )}, Lon: ${lonVal.toFixed(5)}`,
                });
              }}
            />

            {/* 📍 Show Lat/Lon after selection */}
            {lat && lng && (
              <div className="text-sm text-muted-foreground">
                <span>Latitude: {lat.toFixed(6)}</span>
                <br />
                <span>Longitude: {lng.toFixed(6)}</span>
              </div>
            )}
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
                if (
                  !locationName.trim() ||
                  lat == null ||
                  lng == null ||
                  !selectedDeviceId
                ) {
                  toast({
                    title: "Invalid Input",
                    description:
                      "Please select a valid location from the map search.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  await api.saveDeviceLocation(selectedDeviceId, {
                    location: locationName.trim(),
                    lat,
                    lng,
                  });
                  toast({
                    title: "Location Saved",
                    description: `Saved "${locationName}" with coordinates.`,
                  });
                  setIsLocationDialogOpen(false);
                  await initializeDashboard();
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


