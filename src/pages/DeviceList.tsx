/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Cpu,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  Thermometer,
  Droplets,
  Zap,
  MapPin,
  Clock,
  RefreshCw,
} from "lucide-react";
import { api } from "@/services/api.ts";
import { toast } from "@/hooks/use-toast";

interface Device {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline";
  location: string;
  telemetry: {
    temperature?: number;
    humidity?: number;
    voltage?: number;
  };
}

const DeviceList = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");



  useEffect(() => {
const userData = localStorage.getItem("user");
const user = userData ? JSON.parse(userData) : null;
const token =
  user?.role === "admin"
    ? localStorage.getItem("adminToken") || ""
    : localStorage.getItem("token") || "";

if (!token || !user) {
  navigate("/");
  return;
}

    initializeDeviceList();
  }, [navigate]);

  useEffect(() => {
    let filtered = devices;

    if (searchQuery) {
      filtered = filtered.filter(
        (device) =>
          device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          device.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          device.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((device) => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  }, [devices, searchQuery, statusFilter]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
      }
    }

    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);


  const initializeDeviceList = async () => {
    try {
      setIsLoading(true);
      await fetchAllDevices();
    } catch (error) {
      console.error("Device list initialization error:", error);

      // Handle authentication errors
      if (
        error instanceof Error &&
        error.message.includes("Authentication expired")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("customerId");
        navigate("/");
        return;
      }

      toast({
        title: "Error",
        description: "Failed to load device list",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllDevices = async () => {
    try {
      console.log("Fetching all devices with JWT authentication...");

      // Fetch all customer devices using JWT-authenticated endpoint
      const devicesResult = await api.getMyDevices();
      console.log("All devices result:", devicesResult);

      if (devicesResult.error) {
        throw new Error(devicesResult.error);
      }

      const list = devicesResult.data || [];
      if (list.length === 0) {
        setDevices([]);
        toast({
          title: "No Devices Found",
          description: "No devices found for your account",
          variant: "destructive",
          duration: 2000,
        });
        return;
      }

      // Process devices and fetch their live telemetry
      const devicesWithTelemetry: Device[] = [];
      console.log(`Processing ${list.length} devices...`);

      // Process in small batches to avoid spiking the API
      const batchSize = 5;
      for (let i = 0; i < list.length; i += batchSize) {
        const batch = list.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (deviceInfo) => {
            try {
              console.log(
                `Fetching LIVE data for: ${deviceInfo.name} (${deviceInfo.id.id})`
              );

              // Use live endpoint: considers points within last 60s
              const live = await api.getDeviceLiveData(
                deviceInfo.id.id,
                undefined,
                60
              );
              console.log(`Live for ${deviceInfo.name}:`, live);

              const liveData: Record<
                string,
                { value: any; timestamp: number; isLive?: boolean }
              > = live?.data || {};

              // Determine ONLINE if any recent datapoint exists
              const isOnline = !!(live?.isLive || (live?.dataCount ?? 0) > 0);

              // Compute last seen from newest live timestamp (if any)
              const lastTs = Object.values(liveData).reduce(
                (max, d) =>
                  d?.timestamp && d.timestamp > max ? d.timestamp : max,
                0
              );
              const lastSeen =
                lastTs > 0 ? formatRelativeTime(lastTs) : "No telemetry";

              const transformedDevice: Device = {
                id: deviceInfo.id.id,
                name: deviceInfo.name,
                type: deviceInfo.type,
                status: isOnline ? "online" : "offline",
                location: "Loading...",
                // Reuse your extractor: it understands { value, timestamp } objects
                telemetry: extractTelemetryValues(liveData),
              };
              // 🔹 Now fetch location from your DB and override it
              try {
                const locationRes = await api.getDeviceLocation(
                  deviceInfo.id.id
                );
                transformedDevice.location = locationRes?.location || "Not set";
              } catch (err) {
                console.warn(
                  `Failed to fetch saved location for ${deviceInfo.name}`
                );
                transformedDevice.location = "Not set";
              }
              return transformedDevice;
            } catch (telemetryError) {
              console.error(
                `Live fetch failed for ${deviceInfo.name}:`,
                telemetryError
              );

              // On error treat device as offline
              const transformedDevice: Device = {
                id: deviceInfo.id.id,
                name: deviceInfo.name,
                type: deviceInfo.type,
                status: "offline",
                // lastSeen: "No telemetry",
                location: deviceInfo.customerTitle || "No location set",
                telemetry: {},
              };
              return transformedDevice;
            }
          })
        );

        devicesWithTelemetry.push(...batchResults);
      }

      setDevices(devicesWithTelemetry);
      console.log("Final devices list:", devicesWithTelemetry);

      const onlineCount = devicesWithTelemetry.filter(
        (d) => d.status === "online"
      ).length;
      const offlineCount = devicesWithTelemetry.filter(
        (d) => d.status === "offline"
      ).length;

      toast({
        title: "Devices Loaded",
        description: `Online: ${onlineCount} • Offline: ${offlineCount}`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Fetch all devices error:", error);

      // Handle authentication errors
      if (
        error instanceof Error &&
        error.message.includes("Authentication expired")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("customerId");
        navigate("/");
        return;
      }

      toast({
        title: "API Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch devices",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  
  const extractTelemetryValues = (
    telemetry: Record<string, { value: any; timestamp: number }>
  ) => {
    const result: {
      temperature?: number;
      humidity?: number;
      voltage?: number;
    } = {};

    // Look for temperature
    Object.keys(telemetry).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("temperature") &&
        typeof telemetry[key].value === "number"
      ) {
        result.temperature = telemetry[key].value;
      }
      if (
        lowerKey.includes("humidity") &&
        typeof telemetry[key].value === "number"
      ) {
        result.humidity = telemetry[key].value;
      }
      if (
        lowerKey.includes("voltage") &&
        typeof telemetry[key].value === "number"
      ) {
        result.voltage = telemetry[key].value;
      }
    });

    return result;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      // case "warning":
      //   return "bg-warning";
      case "offline":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Activity className="w-4 h-4 text-success" />;
      // case "warning":
      //   return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "offline":
        return <Cpu className="w-4 h-4 text-destructive" />;
      default:
        return <Cpu className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header */}
        {/* <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Device Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage all your connected devices
            </p>
          </div>
          <Button
            onClick={() => initializeDeviceList()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </Button>
        </div> */}

        {/* Filters */}
        {/* Compact Filters + Search Icon */}
        <div className="flex items-center justify-between w-full px-2 mb-4">
          {/* Left side filters */}
          <div className="flex items-center gap-2">
            {/* All */}
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="text-xs px-3 py-1.5 h-7 flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              All ({devices.length})
            </Button>

            {/* Online */}
            <Button
              variant={statusFilter === "online" ? "default" : "outline"}
              onClick={() => setStatusFilter("online")}
              className="text-xs px-3 py-1.5 h-7 flex items-center gap-1"
            >
              <Activity className="w-3 h-3" />
              Online ({devices.filter((d) => d.status === "online").length})
            </Button>

            {/* Offline */}
            <Button
              variant={statusFilter === "offline" ? "default" : "outline"}
              onClick={() => setStatusFilter("offline")}
              className="text-xs px-3 py-1.5 h-7 flex items-center gap-1"
            >
              <Cpu className="w-3 h-3" />
              Offline ({devices.filter((d) => d.status === "offline").length})
            </Button>
          </div>

          {/* Right side search icon */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowSearch((prev) => !prev)} // toggle a small search overlay if you want later
              className="p-2 rounded-md hover:bg-muted/70 transition"
            >
              <Search className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {/* Small floating search bar */}
          {showSearch && (
            <div
              ref={searchRef} // 👈 attach ref here
              className="
      absolute right-4 top-16 bg-card border border-border 
      rounded-md p-2 shadow-lg w-56 z-50 transition-all
    "
            >
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Device Grid */}
        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="industrial-card animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDevices.map((device) => (
              <Card
                key={device.id}
                className="telemetry-card cursor-pointer hover:bg-muted/50 transition-colors"
                // onClick={() =>
                //   navigate(`/devices/${device.id}`, {
                //     state: { from: "devices" },
                //   })
                // }

                onClick={async () => {
                  const res = await api.getDeviceLocation(device.id);
                  if (res.location) {
                    navigate(`/devices/${device.id}`);
                  } else {
                    setSelectedDeviceId(device.id);
                    setLocationName("");
                    setIsLocationDialogOpen(true);
                  }
                }}
              >
                {" "}
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <CardTitle className="text-sm sm:text-base leading-tight truncate">
                        {device.name}
                      </CardTitle>
                      {/* <CardDescription className="mt-1 text-xs">
                        {device.type}
                      </CardDescription> */}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getStatusIcon(device.status)}
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          device.status
                        )}`}
                      ></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground">
                        {device.location || "Not set"}
                      </span>
                    </div>
                    {/* Location & Last Seen */}
                    {/* <div className="space-y-2">

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location:
                        </span>
                        <span className="text-foreground truncate ml-2">
                          {device.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">
                          {localStorage.getItem(
                            `device_location_${device.id}`
                          ) || "Not set"}
                        </span>
                      </div>
                    </div> */}

                    {/* Telemetry Data */}
                    {/* <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      {device.telemetry.temperature !== undefined && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-accent" />
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Temp
                            </div>
                            <div className="text-sm font-medium text-accent">
                              {device.telemetry.temperature.toFixed(1)}°C
                            </div>
                          </div>
                        </div>
                      )}

                      {device.telemetry.humidity !== undefined && (
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Humidity
                            </div>
                            <div className="text-sm font-medium text-primary">
                              {device.telemetry.humidity.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )}

                      {device.telemetry.voltage !== undefined && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-warning" />
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Voltage
                            </div>
                            <div className="text-sm font-medium text-warning">
                              {device.telemetry.voltage.toFixed(1)}V
                            </div>
                          </div>
                        </div>
                      )}
                    </div> */}

                    {/* Status Badge */}
                    {/* <div className="pt-2 flex justify-between items-center">
                      <Badge
                        variant={
                          device.status === "online"
                            ? "default"
                            : device.status === "warning"
                            ? "secondary"
                            : "destructive"
                        }
                        className="capitalize text-xs px-2 py-1"
                      >
                        {device.status}
                      </Badge>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredDevices.length === 0 && devices.length > 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No devices match your filters
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or filter criteria
            </p>
          </div>
        )}

        {!isLoading && devices.length === 0 && (
          <div className="text-center py-12">
            <Cpu className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No devices found
            </h3>
            <p className="text-muted-foreground mb-4">
              No devices are currently connected to your account. Make sure
              devices are properly configured and assigned to your customer in
              ThingsBoard.
            </p>
            <Button onClick={() => initializeDeviceList()} className="gap-2">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Retry Loading
            </Button>
          </div>
        )}
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
                  await initializeDeviceList(); // refresh
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

export default DeviceList;
