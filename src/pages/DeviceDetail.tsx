/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Activity,
  Clock,
  MapPin,
  Cpu,

  RefreshCw,
  AlertTriangle,

  Settings,
} from "lucide-react";
import { api } from "@/services/api.ts";
import { toast } from "@/hooks/use-toast";

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "warning";
  lastSeen: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
}

interface TelemetryData {
  timestamp: string;
  [key: string]: any;
}

interface RealTimeData {
  deviceId: string;
  timestamp: number;
  telemetry: Record<string, { value: any; timestamp: number }>;
  attributes: Record<string, any>;
  keys: string[];
}

interface TelemetryWidget {
  key: string;
  displayName: string;
  value: any;
  timestamp: number;
  unit: string;
  category: string;
  icon: string;
  color: string;
  path: string;
}

interface DeviceAttributes {
  deviceId: string;
  scope: string;
  attributes: Record<string, any>;
  timestamp: number;
}

interface AttributeWidget {
  key: string;
  displayName: string;
  value: Array<{ key: string; data: { value: any; timestamp: number } }>; // Changed to array like telemetry
  timestamp: number;
  category: string;
  icon: string;
  color: string;
}

interface LiveDataResponse {
  deviceId: string;
  data: Record<string, { value: any; timestamp: number; isLive: boolean }>;
  timestamp: number;
  maxAgeSeconds: number;
  dataCount: number;
  keys: string[];
  isLive: boolean;
}

const DeviceDetail = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealTimeData | null>(null);
  const [historicalData, setHistoricalData] = useState<TelemetryData[]>([]);
  const [telemetryWidgets, setTelemetryWidgets] = useState<TelemetryWidget[]>(
    []
  );
  const [isLivePolling, setIsLivePolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [deviceAttributes, setDeviceAttributes] =
    useState<DeviceAttributes | null>(null);
  const [attributeWidgets, setAttributeWidgets] = useState<AttributeWidget[]>(
    []
  );
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    if (!deviceId) return;
    initializeDeviceData();
  }, [deviceId, navigate]);

useEffect(() => {
  let interval: NodeJS.Timeout;
  if (deviceId) {
    setIsLivePolling(true);
    fetchLiveData(); // Call the new live data function
    interval = setInterval(fetchLiveData, 5000); // Poll every 5 seconds
  }
  return () => {
    if (interval) clearInterval(interval);
    setIsLivePolling(false);
  };
}, [deviceId]);

  // Helper function to format attribute names for better readability
  const formatAttributeName = (key: string): string => {
    // Handle common attribute names
    const nameMap: Record<string, string> = {
      addr: "Address",
      lastActivityTime: "Last Activity",
      lastConnectTime: "Last Connect",
      lastDisconnectTime: "Last Disconnect",
      name: "Device Name",
      unit: "Unit of Measure",
      value: "Current Value",
    };

    if (nameMap[key]) {
      return nameMap[key];
    }

    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper function to format attribute values for display
  const formatAttributeValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    // Handle numbers (especially timestamps)
    if (typeof value === "number") {
      // Check if it looks like a timestamp (13 digits)
      if (value.toString().length === 13) {
        return new Date(value).toLocaleString();
      }
      // Regular numbers
      return value.toString();
    }

    // Handle strings
    if (typeof value === "string") {
      return value;
    }

    // Handle objects - don't stringify them, extract meaningful value
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const initializeDeviceData = async () => {
    try {
      setIsLoading(true);
      await fetchRealDeviceData();
      // Add this call to fetch attributes
      await fetchDeviceAttributes();
    } catch (error) {
      console.error("Device initialization error:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication expired")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }
      toast({
        title: "Initialization Error",
        description: "Failed to load device data",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

const fetchRealtimeData = async () => {
  if (!deviceId) return;

  try {
    console.log("Fetching initial realtime data for:", deviceId);
    const result = await api.getDeviceRealtime(deviceId);
    console.log("Initial realtime data result:", result);

    if (result) {
      setRealtimeData(result);
      generateTelemetryWidgets(result);
      setLastUpdated(new Date());
    }
  } catch (error) {
    console.error("Initial realtime data fetch error:", error);
    // Fallback to live data if regular realtime fails
    await fetchLiveData();
  }
};

const fetchLiveData = async () => {
  if (!deviceId) return;

  try {
    console.log("Fetching live data for:", deviceId);

    // Call the NEW live endpoint
    const liveData = await api.getDeviceLiveData(deviceId, undefined, 30);
    console.log("Live data result:", liveData);

    // Check if we have any live data
    if (liveData && liveData.dataCount > 0) {
      // Transform the live data to match your existing structure
      const transformedData = {
        deviceId: liveData.deviceId,
        timestamp: liveData.timestamp,
        telemetry: liveData.data || {}, // The live endpoint returns data in .data
        attributes: {},
        keys: liveData.keys || [],
      };

      setRealtimeData(transformedData);
      generateTelemetryWidgets(transformedData);
      setLastUpdated(new Date());

      console.log("Updated with fresh live data:", transformedData);
    } else {
      // No live data - clear the display
      console.log("No live data available - clearing display");
      setRealtimeData(null);
      setTelemetryWidgets([]);
      setLastUpdated(new Date());
    }
  } catch (error) {
    console.error("Live data fetch error:", error);

    // Handle authentication errors
    if (
      error instanceof Error &&
      error.message.includes("Authentication expired")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
      return;
    }

    console.warn("Failed to fetch live data, retrying in 5 seconds...");
  }
};
  
  const fetchDeviceAttributes = async () => {
    if (!deviceId) return;

    try {
      setIsLoadingAttributes(true);
      console.log("Fetching device attributes for:", deviceId);

      // Fetch server attributes
      const result = await api.getDeviceAttributes(deviceId, "SERVER_SCOPE");
      console.log("Device attributes result:", result);

      if (result && result.attributes) {
        setDeviceAttributes(result);
        generateAttributeWidgets(result);
      } else {
        console.log("No attributes found for device");
        setDeviceAttributes({
          deviceId,
          scope: "SERVER_SCOPE",
          attributes: {},
          timestamp: Date.now(),
        });
        setAttributeWidgets([]);
      }
    } catch (error) {
      console.error("Device attributes fetch error:", error);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  // Add this helper function to generate attribute widgets
  const generateAttributeWidgets = (attributesData: DeviceAttributes) => {
    const widgets: AttributeWidget[] = [];

    if (
      attributesData.attributes &&
      Object.keys(attributesData.attributes).length > 0
    ) {
      // Process and clean the attributes data
      const attributeParameters = Object.entries(attributesData.attributes).map(
        ([key, rawValue]) => {
          let cleanKey = key;
          let cleanValue = rawValue;

          // Check if the value is a complex JSON object with key/value structure
          if (typeof rawValue === "object" && rawValue !== null) {
            if ("key" in rawValue && "value" in rawValue) {
              // Extract the actual key and value from the JSON structure
              cleanKey = rawValue.key || key;
              cleanValue = rawValue.value;
            } else if ("lastUpdateTs" in rawValue) {
              // Handle timestamp objects - show only the main value
              cleanValue = rawValue.value || rawValue;
            } else {
              // For other complex objects, stringify them
              cleanValue = JSON.stringify(rawValue);
            }
          }

          return {
            key: cleanKey,
            data: {
              value: cleanValue,
              timestamp: attributesData.timestamp,
            },
          };
        }
      );

      const consolidatedWidget: AttributeWidget = {
        key: "server_attributes",
        displayName: "Server Attributes",
        value: attributeParameters,
        timestamp: attributesData.timestamp,
        category: "server",
        icon: "Settings",
        color: "text-blue-500",
      };

      widgets.push(consolidatedWidget);
    }

    setAttributeWidgets(widgets);
    console.log("Generated clean attribute widgets:", widgets);
  };

  const getAttributeIcon = (key: string): string => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("name") || lowerKey.includes("addr")) return "User";
    if (lowerKey.includes("time") || lowerKey.includes("activity"))
      return "Clock";
    if (lowerKey.includes("unit") || lowerKey.includes("value"))
      return "Settings";
    return "Info";
  };

  const getAttributeColor = (key: string, index: number): string => {
    const colors = [
      "text-blue-500",
      "text-green-500",
      "text-purple-500",
      "text-orange-500",
      "text-pink-500",
      "text-cyan-500",
    ];
    return colors[index % colors.length];
  };

  const fetchRealDeviceData = async () => {
    try {
      if (!deviceId) return;

      console.log("Fetching device info for:", deviceId);
      const deviceResult = await api.getDeviceInfo(deviceId);
      console.log("Device info result:", deviceResult);

      if (deviceResult.error) {
        throw new Error(deviceResult.error);
      }

      const deviceInfo = deviceResult;
      const transformedDevice: DeviceInfo = {
        id: deviceInfo.id?.id || deviceId,
        name: deviceInfo.name || "Unknown Device",
        type: deviceInfo.type || "Unknown Type",
        status: deviceInfo.active ? "online" : "offline",
        lastSeen: deviceInfo.createdTime
          ? formatRelativeTime(deviceInfo.createdTime)
          : "Unknown",
        location: deviceInfo.customerTitle || "No location set",
        manufacturer: "ThingsBoard Device",
        model: deviceInfo.deviceProfileName || "Unknown Model",
        serialNumber: deviceId,
        firmwareVersion: "v1.0.0",
      };

      setDevice(transformedDevice);
      console.log("Transformed device:", transformedDevice);

      await fetchRealtimeData();
      await fetchHistoricalData();
      await fetchDeviceAttributes();
    } catch (error) {
      console.error("Real device data fetch error:", error);
      toast({
        title: "Device Data Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch device data",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const fetchHistoricalData = async () => {
    if (!deviceId) return;

    try {
      console.log("Fetching historical data for:", deviceId);
      const result = await api.getDeviceHistory(deviceId, undefined, 24);
      console.log("Historical data result:", result);

      if (result && result.data) {
        const transformedData: TelemetryData[] = [];
        const telemetryData = result.data;

        const allTimestamps = new Set<number>();
        Object.values(telemetryData).forEach((values: any[]) => {
          values.forEach((item) => allTimestamps.add(item.timestamp));
        });

        Array.from(allTimestamps)
          .sort((a, b) => a - b)
          .slice(-50)
          .forEach((ts) => {
            const dataPoint: TelemetryData = {
              timestamp: new Date(ts).toISOString(),
            };

            Object.entries(telemetryData).forEach(([key, values]) => {
              const matchingValue = (values as any[]).find(
                (v) => v.timestamp === ts
              );
              if (matchingValue) {
                // Store all sensor data with their full keys
                dataPoint[key] = matchingValue.value;

                // Also create simplified keys for backward compatibility
                if (key.toLowerCase().includes("temperature")) {
                  dataPoint.temperature = matchingValue.value;
                } else if (key.toLowerCase().includes("humidity")) {
                  dataPoint.humidity = matchingValue.value;
                } else if (key.toLowerCase().includes("voltage")) {
                  dataPoint.voltage = matchingValue.value;
                }
              }
            });

            transformedData.push(dataPoint);
          });

        setHistoricalData(transformedData);
        console.log("Transformed historical data:", transformedData);

        // Debug: Show all available keys in the first data point
        if (transformedData.length > 0) {
          console.log(
            "All keys in first data point:",
            Object.keys(transformedData[0])
          );
        }
      }
    } catch (error) {
      console.error("Historical data fetch error:", error);
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

  const generateTelemetryWidgets = (data: RealTimeData) => {
    const widgets: TelemetryWidget[] = [];
    const groupedBySensor = new Map<
      string,
      Array<{ key: string; data: any }>
    >();

    Object.entries(data.telemetry).forEach(([key, telemetryData]) => {
      const sensorSystem = extractSensorSystem(key);
      if (!groupedBySensor.has(sensorSystem)) {
        groupedBySensor.set(sensorSystem, []);
      }
      groupedBySensor.get(sensorSystem)?.push({ key, data: telemetryData });
    });

    groupedBySensor.forEach((parameters, sensorSystem) => {
      const widget: TelemetryWidget = {
        key: sensorSystem,
        displayName: `Sensor System ${sensorSystem.toUpperCase()}`,
        value: parameters,
        timestamp: Math.max(...parameters.map((p) => p.data.timestamp)),
        unit: "",
        category: "system",
        icon: "Cpu",
        color: getColorForSensorSystem(sensorSystem),
        path: sensorSystem,
      };
      widgets.push(widget);
    });

    widgets.sort((a, b) => a.key.localeCompare(b.key));
    setTelemetryWidgets(widgets);
    console.log("Generated consolidated sensor widgets:", widgets);
  };

  // FIXED: More flexible sensor system extraction
  const extractSensorSystem = (key: string): string => {
    // Check for existing s1/ pattern first
    const slashMatch = key.match(/^(s\d+)\//);
    if (slashMatch) return slashMatch[1];

    // More flexible pattern matching - use substring contains instead of exact matches
    const lowerKey = key.toLowerCase();

    // Group S1 parameters more flexibly
    if (
      lowerKey.includes("v1n") ||
      lowerKey.includes("v2n") ||
      lowerKey.includes("v3n") ||
      lowerKey.includes("i1") ||
      lowerKey.includes("i2") ||
      lowerKey.includes("i3") ||
      lowerKey.includes("units2") ||
      lowerKey.includes("units3") ||
      lowerKey.includes("frequency") ||
      lowerKey.includes("power factor 1")
    ) {
      return "s1";
    }

    // Group S2 parameters
    if (
      lowerKey.includes("v4n") ||
      lowerKey.includes("v5n") ||
      lowerKey.includes("v6n") ||
      lowerKey.includes("power factor 2")
    ) {
      return "s2";
    }

    // Fallback for anything else with voltage/current
    if (lowerKey.includes("voltage") || lowerKey.includes("current")) {
      return "s1"; // Default electrical parameters to s1
    }

    return "unknown";
  };

  const getColorForSensorSystem = (sensorSystem: string): string => {
    switch (sensorSystem) {
      case "s1":
        return "text-warning";
      case "s2":
        return "text-primary";
      case "s3":
        return "text-success";
      case "s4":
        return "text-purple-500";
      default:
        return "text-accent";
    }
  };

  const formatParameterName = (key: string): string => {
    const parts = key.split("/");
    if (parts.length >= 2) {
      return parts[1];
    }
    return key;
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

  if (isLoading || !device) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="industrial-card">
                  <CardContent className="p-3">
                    <div className="h-16 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

 return (
   <AppLayout>
     <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center gap-4">
         <div className="flex items-center gap-4">
           <Button
             variant="outline"
             size="icon"
             onClick={() => navigate("/devices")}
             className="h-8 w-8 sm:h-10 sm:w-10"
           >
             <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
           </Button>
           <div className="flex-1">
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
               <h1 className="text-lg sm:text-xl font-bold text-foreground">
                 {device.name}
               </h1>
               <div className="flex items-center gap-2">
                 <div
                   className={`status-indicator ${getStatusColor(
                     device.status
                   )}`}
                 ></div>
                 <Badge
                   variant={
                     device.status === "online" ? "default" : "secondary"
                   }
                   className="capitalize text-xs"
                 >
                   {device.status}
                 </Badge>
               </div>
             </div>
             <p className="text-sm text-muted-foreground">
               {device.type} • {device.location}
             </p>
           </div>
         </div>

         {/*<div className="flex sm:justify-end">
           <Button
             variant="outline"
             onClick={() => fetchLiveData()}
             className="text-xs sm:text-sm h-8 sm:h-9 px-3"
             disabled={isLivePolling}
           >
             <RefreshCw
               className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${
                 isLivePolling ? "animate-spin" : ""
               }`}
             />
             {isLivePolling ? "Updating..." : "Refresh Live"}
           </Button>
         </div> */}
       </div>

       {/* Dynamic Telemetry Widgets */}
       <div className="space-y-4">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
           <h2 className="text-base sm:text-lg font-semibold text-foreground flex flex-col sm:flex-row sm:items-center gap-2">
             Live Telemetry Data ({telemetryWidgets.length} sensor systems)
             <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
               <div
                 className={`w-2 h-2 rounded-full animate-pulse ${
                   realtimeData && Date.now() - realtimeData.timestamp < 30000
                     ? "bg-green-500"
                     : realtimeData &&
                       Date.now() - realtimeData.timestamp < 60000
                     ? "bg-yellow-500"
                     : "bg-red-500"
                 }`}
               ></div>
               Auto-updating every 5s
               {realtimeData && (
                 <span className="ml-2 text-xs">
                   (Data:{" "}
                   {Math.round((Date.now() - realtimeData.timestamp) / 1000)}s
                   old)
                 </span>
               )}
             </div>
           </h2>
           {lastUpdated && (
             <p className="text-xs text-muted-foreground">
               Last updated: {lastUpdated.toLocaleTimeString()}
             </p>
           )}
         </div>

         {telemetryWidgets.length > 0 ? (
           <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
             {telemetryWidgets.map((widget, index) => (
               <Card
                 key={`${widget.key}-${index}`}
                 className={`telemetry-card hover:bg-muted/50 transition-all ${
                   realtimeData && Date.now() - realtimeData.timestamp > 60000
                     ? "border-yellow-500/50"
                     : ""
                 }`}
               >
                 <CardContent className="p-3 sm:p-4">
                   {/* Add stale data warning */}
                   {realtimeData &&
                     Date.now() - realtimeData.timestamp > 60000 && (
                       <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-700">
                         ⚠️ Data may be stale (
                         {Math.round(
                           (Date.now() - realtimeData.timestamp) / 1000
                         )}
                         s old)
                       </div>
                     )}

                   <div className="space-y-3 sm:space-y-4">
                     <div className="flex items-center justify-between">
                       <h3
                         className={`text-base sm:text-lg font-semibold ${widget.color}`}
                       >
                         {widget.displayName}
                       </h3>
                       <div
                         className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${widget.color.replace(
                           "text-",
                           "bg-"
                         )}/20 flex items-center justify-center`}
                       >
                         <Cpu
                           className={`w-4 h-4 sm:w-5 sm:h-5 ${widget.color}`}
                         />
                       </div>
                     </div>

                     <div className="space-y-2">
                       {Array.isArray(widget.value) &&
                         widget.value.map((param, paramIndex) => (
                           <div
                             key={paramIndex}
                             className="flex items-center justify-between py-2 border-b border-muted/50 last:border-b-0"
                           >
                             <div className="flex items-center gap-2">
                               <Settings
                                 className={`w-4 h-4 ${widget.color}`}
                               />
                               <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                 {formatParameterName(param.key)}
                               </span>
                             </div>
                             <div className="text-right">
                               <p
                                 className={`text-base sm:text-lg font-bold ${widget.color}`}
                               >
                                 {typeof param.data.value === "number"
                                   ? param.data.value.toFixed(2) +
                                     extractUnit(param.key)
                                   : String(param.data.value) +
                                     extractUnit(param.key)}
                               </p>
                               <p className="text-xs text-muted-foreground">
                                 {new Date(
                                   param.data.timestamp
                                 ).toLocaleTimeString()}
                               </p>
                             </div>
                           </div>
                         ))}
                     </div>

                     <div className="text-xs text-muted-foreground">
                       System: {widget.path} •{" "}
                       {Array.isArray(widget.value) ? widget.value.length : 0}{" "}
                       parameters
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         ) : (
           <Card className="industrial-card">
             <CardContent className="p-8 text-center">
               <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
               <h3 className="text-lg font-semibold mb-2">
                 No Fresh Telemetry Data Available
               </h3>
               <p className="text-muted-foreground mb-4">
                 No live telemetry data from the last 30 seconds is available
                 for this device.
               </p>
               <Button
                 variant="outline"
                 onClick={() => fetchLiveData()}
                 className="text-sm"
               >
                 <RefreshCw className="w-4 h-4 mr-2" />
                 Check for Live Data
               </Button>
             </CardContent>
           </Card>
         )}
       </div>

       {/* Tabs Section */}
       <Tabs defaultValue="info" className="space-y-6">
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="info">Device Info</TabsTrigger>
           <TabsTrigger value="raw">Raw Data</TabsTrigger>
         </TabsList>

         <TabsContent value="info">
           <Card className="industrial-card">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Cpu className="w-5 h-5" />
                 Device Information
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                 {/* Left column */}
                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Device ID
                     </label>
                     <p className="text-foreground font-mono text-sm">
                       {device.id}
                     </p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Manufacturer
                     </label>
                     <p className="text-foreground">{device.manufacturer}</p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Model
                     </label>
                     <p className="text-foreground">{device.model}</p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Serial Number
                     </label>
                     <p className="text-foreground font-mono">
                       {device.serialNumber}
                     </p>
                   </div>
                 </div>

                 {/* Right column */}
                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Location
                     </label>
                     <p className="text-foreground flex items-center gap-2">
                       <MapPin className="w-4 h-4" />
                       {device.location}
                     </p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Firmware Version
                     </label>
                     <p className="text-foreground">{device.firmwareVersion}</p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Last Seen
                     </label>
                     <p className="text-foreground flex items-center gap-2">
                       <Clock className="w-4 h-4" />
                       {device.lastSeen}
                     </p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">
                       Status
                     </label>
                     <div className="flex items-center gap-2">
                       <div
                         className={`status-indicator ${getStatusColor(
                           device.status
                         )}`}
                       ></div>
                       <Badge
                         variant={
                           device.status === "online" ? "default" : "secondary"
                         }
                         className="capitalize"
                       >
                         {device.status}
                       </Badge>
                       <Badge variant="outline" className="animate-pulse">
                         <Activity className="w-3 h-3 mr-1" />
                         Live (5s)
                       </Badge>
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="raw">
           <Card className="industrial-card">
             <CardHeader>
               <CardTitle className="text-base sm:text-lg">
                 Raw Telemetry Data
               </CardTitle>
               <CardDescription className="text-xs sm:text-sm">
                 Latest real-time sensor readings from ThingsBoard
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {realtimeData ? (
                   <>
                     <div className="bg-muted p-2 sm:p-4 rounded-lg">
                       <h4 className="font-medium mb-2 text-sm sm:text-base">
                         Telemetry Data:
                       </h4>
                       <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-auto max-h-48 sm:max-h-64 whitespace-pre-wrap break-words">
                         {JSON.stringify(realtimeData.telemetry, null, 2)}
                       </pre>
                     </div>

                     <div className="bg-muted p-2 sm:p-4 rounded-lg">
                       <h4 className="font-medium mb-2 text-sm sm:text-base">
                         Attributes:
                       </h4>
                       <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-auto max-h-48 sm:max-h-64 whitespace-pre-wrap break-words">
                         {JSON.stringify(realtimeData.attributes, null, 2)}
                       </pre>
                     </div>

                     <div className="bg-muted p-2 sm:p-4 rounded-lg">
                       <h4 className="font-medium mb-2 text-sm sm:text-base">
                         Available Keys:
                       </h4>
                       <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-auto max-h-32 sm:max-h-64 whitespace-pre-wrap break-words">
                         {JSON.stringify(realtimeData.keys, null, 2)}
                       </pre>
                     </div>

                     <div className="bg-muted p-2 sm:p-4 rounded-lg">
                       <h4 className="font-medium mb-2 text-sm sm:text-base">
                         Device Info:
                       </h4>
                       <pre className="text-xs sm:text-sm overflow-x-auto overflow-y-auto max-h-32 sm:max-h-64 whitespace-pre-wrap break-words">
                         {JSON.stringify(
                           {
                             deviceId: realtimeData.deviceId,
                             timestamp: new Date(
                               realtimeData.timestamp
                             ).toISOString(),
                             dataAge: `${Math.round(
                               (Date.now() - realtimeData.timestamp) / 1000
                             )}s ago`,
                           },
                           null,
                           2
                         )}
                       </pre>
                     </div>
                   </>
                 ) : (
                   <div className="text-center py-8 text-muted-foreground">
                     <p className="text-sm sm:text-base">
                       No real-time data available. Check if device is sending
                       telemetry to ThingsBoard.
                     </p>
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   </AppLayout>
 );
};

// FIXED: Helper function to extract unit from key name
const extractUnit = (key: string): string => {
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes("voltage") ||
    lowerKey.includes("v1n") ||
    lowerKey.includes("v2n") ||
    lowerKey.includes("v3n")
  )
    return "V";
  if (
    lowerKey.includes("current") ||
    lowerKey.includes("i1") ||
    lowerKey.includes("i2") ||
    lowerKey.includes("i3")
  )
    return "A";
  if (lowerKey.includes("temperature") || lowerKey.includes("temp"))
    return "°C";
  if (lowerKey.includes("humidity")) return "%";
  if (lowerKey.includes("power") || lowerKey.includes("watts")) return "W";
  if (lowerKey.includes("frequency") || lowerKey.includes("freq")) return "Hz";
  if (lowerKey.includes("factor")) return "";
  if (lowerKey.includes("units")) return "";
  return "";
};

export default DeviceDetail;
