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
import { Input } from "@/components/ui/input";
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
  lastSeen: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
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

  // const fetchAllDevices = async () => {
  //   try {
  //     console.log("Fetching all devices with JWT authentication...");

  //     // Fetch all customer devices using JWT-authenticated endpoint
  //     const devicesResult = await api.getMyDevices();
  //     console.log("All devices result:", devicesResult);

  //     if (devicesResult.error) {
  //       throw new Error(devicesResult.error);
  //     }

  //     if (!devicesResult.data || devicesResult.data.length === 0) {
  //       setDevices([]);
  //       toast({
  //         title: "No Devices Found",
  //         description: "No devices found for your account",
  //         variant: "destructive",
  //         duration: 2000,
  //       });
  //       return;
  //     }

  //     // Process devices and fetch their telemetry
  //     const devicesWithTelemetry: Device[] = [];

  //     console.log(`Processing ${devicesResult.data.length} devices...`);

  //     // Process devices in batches to avoid overwhelming the API
  //     const batchSize = 5;
  //     for (let i = 0; i < devicesResult.data.length; i += batchSize) {
  //       const batch = devicesResult.data.slice(i, i + batchSize);

  //       const batchPromises = batch.map(async (deviceInfo) => {
  //         try {
  //           console.log(
  //             `Fetching telemetry for: ${deviceInfo.name} (${deviceInfo.id.id})`
  //           );

  //           const telemetryResult = await api.getDeviceRealtime(
  //             deviceInfo.id.id
  //           );
  //           console.log(`Telemetry for ${deviceInfo.name}:`, telemetryResult);

  //           const transformedDevice: Device = {
  //             id: deviceInfo.id.id,
  //             name: deviceInfo.name,
  //             type: deviceInfo.type,
  //             status: deviceInfo.active ? "online" : "offline",
  //             lastSeen: deviceInfo.createdTime
  //               ? formatRelativeTime(deviceInfo.createdTime)
  //               : "Unknown",
  //             location: deviceInfo.customerTitle || "No location set",
  //             telemetry: extractTelemetryValues(
  //               telemetryResult.telemetry || {}
  //             ),
  //           };

  //           // Set warning status if device has no recent telemetry
  //           if (
  //             !telemetryResult.telemetry ||
  //             Object.keys(telemetryResult.telemetry).length === 0
  //           ) {
  //             transformedDevice.status = "warning";
  //             transformedDevice.lastSeen = "No telemetry data";
  //           }

  //           return transformedDevice;
  //         } catch (telemetryError) {
  //           console.error(
  //             `Telemetry fetch failed for ${deviceInfo.name}:`,
  //             telemetryError
  //           );

  //           return {
  //             id: deviceInfo.id.id,
  //             name: deviceInfo.name,
  //             type: deviceInfo.type,
  //             status: "warning" as const,
  //             lastSeen: "No telemetry",
  //             location: deviceInfo.customerTitle || "No location set",
  //             telemetry: {},
  //           };
  //         }
  //       });

  //       const batchResults = await Promise.all(batchPromises);
  //       devicesWithTelemetry.push(...batchResults);
  //     }

  //     setDevices(devicesWithTelemetry);
  //     console.log("Final devices list:", devicesWithTelemetry);

  //     toast({
  //       title: "Devices Loaded",
  //       description: `Successfully loaded ${devicesWithTelemetry.length} devices from ThingsBoard`,
  //       duration: 2000,
  //     });
  //   } catch (error) {
  //     console.error("Fetch all devices error:", error);

  //     // Handle authentication errors
  //     if (
  //       error instanceof Error &&
  //       error.message.includes("Authentication expired")
  //     ) {
  //       localStorage.removeItem("token");
  //       localStorage.removeItem("user");
  //       localStorage.removeItem("customerId");
  //       navigate("/");
  //       return;
  //     }

  //     toast({
  //       title: "API Error",
  //       description:
  //         error instanceof Error ? error.message : "Failed to fetch devices",
  //       variant: "destructive",
  //       duration: 2000,
  //     });
  //   }
  // };


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
                lastSeen,
                location: deviceInfo.customerTitle || "No location set",
                // Reuse your extractor: it understands { value, timestamp } objects
                telemetry: extractTelemetryValues(liveData),
              };

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
                lastSeen: "No telemetry",
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
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search devices by name, type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="text-xs px-2 py-1 h-7 sm:h-8 sm:px-3 sm:py-2 flex-shrink-0"
            >
              <Filter className="w-3 h-3 mr-1" />
              All ({devices.length})
            </Button>
            <Button
              variant={statusFilter === "online" ? "default" : "outline"}
              onClick={() => setStatusFilter("online")}
              className="text-xs px-2 py-1 h-7 sm:h-8 sm:px-3 sm:py-2 flex-shrink-0"
            >
              <Activity className="w-3 h-3 mr-1" />
              Online ({devices.filter((d) => d.status === "online").length})
            </Button>
            {/* <Button
              variant={statusFilter === "warning" ? "default" : "outline"}
              onClick={() => setStatusFilter("warning")}
              className="text-xs px-2 py-1 h-7 sm:h-8 sm:px-3 sm:py-2 flex-shrink-0"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Warning ({devices.filter((d) => d.status === "warning").length})
            </Button> */}
            <Button
              variant={statusFilter === "offline" ? "default" : "outline"}
              onClick={() => setStatusFilter("offline")}
              className="text-xs px-2 py-1 h-7 sm:h-8 sm:px-3 sm:py-2 flex-shrink-0"
            >
              <Cpu className="w-3 h-3 mr-1" />
              Offline ({devices.filter((d) => d.status === "offline").length})
            </Button>
          </div>
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
                onClick={() => navigate(`/devices/${device.id}`)}
              >
                {" "}
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <CardTitle className="text-sm sm:text-base leading-tight truncate">
                        {device.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {device.type}
                      </CardDescription>
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
                    {/* Location & Last Seen */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location:
                        </span>
                        <span className="text-foreground truncate ml-2">
                          {device.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last Seen:
                        </span>
                        <span className="text-muted-foreground">
                          {device.lastSeen}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry Data */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
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
                    </div>

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
    </AppLayout>
  );
};

export default DeviceList;
