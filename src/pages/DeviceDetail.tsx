/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil } from "lucide-react";

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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import GaugeCard from "@/components/GaugeCard";
import MetricCard from "@/components/GaugeCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";



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

interface LogEntry {
  timestamp: number;
  value: string;
}

const DeviceDetail = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as "admin" | "devices" | undefined;
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");


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

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsDedupRef = useRef<Set<string>>(new Set());

  const [role, setRole] = useState<"admin" | "user">("user");
const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
const [telemetryHistory, setTelemetryHistory] = useState<Record<string, any[]>>(
  {}
);
const [isChartLoading, setIsChartLoading] = useState(false);


  // Helper: push a log line if not duplicate
  const pushLog = (ts: number, raw: any) => {
    const value = typeof raw === "string" ? raw : JSON.stringify(raw);
    const key = `${ts}|${value}`;
    if (logsDedupRef.current.has(key)) return;
    logsDedupRef.current.add(key);
    setLogs((prev) => {
      const next = [{ timestamp: ts, value }, ...prev];
      // keep last 200
      return next.slice(0, 200);
    });
  };

useEffect(() => {
  const normalUser = localStorage.getItem("user");
  const adminUser = localStorage.getItem("adminUser");

  const parsedUser = normalUser
    ? JSON.parse(normalUser)
    : adminUser
    ? JSON.parse(adminUser)
    : null;

  const detectedRole: "admin" | "user" =
    parsedUser?.role === "admin" ? "admin" : "user";
  setRole(detectedRole); // ✅ Store it in state

  const token =
    detectedRole === "admin"
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("token");

  if (!token || !parsedUser) {
    console.warn("No valid session — redirecting to login");
    navigate("/login");
    return;
  }

  initializeDeviceData(detectedRole);
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

  useEffect(() => {
    if (realtimeData) {
      generateTelemetryWidgets(realtimeData);
    }
  }, [deviceAttributes, realtimeData]);

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

 const initializeDeviceData = async (role?: "admin" | "user") => {
   try {
     setIsLoading(true);
     await fetchRealDeviceData(role);
     // Add this call to fetch attributes
     await fetchDeviceAttributes(role);
     if (role === "admin") {
       await fetchLogsHistory(24, 200, role);
     }
 // Fetch last 24 hours of logs, max 200 entries
   } catch (error) {
     console.error("Device initialization error:", error);
     if (
       error instanceof Error &&
       error.message.includes("Authentication expired")
     ) {
       localStorage.removeItem("token");
       localStorage.removeItem("user");
             localStorage.removeItem("adminToken");
             localStorage.removeItem("adminUser");
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

  const fetchLogsHistory = async (hours: number = 24, limit = 200,role?: "admin" | "user") => {
    if (!deviceId) return;
    try {
      const result = await api.getDeviceHistory(deviceId, "logs", hours, role);
      const arr = (result?.data?.logs ?? []) as Array<{
        timestamp: number;
        value: any;
      }>;
      // newest first
      const normalized = arr
        .map((p) => ({
          timestamp: p.timestamp,
          value:
            typeof p.value === "string" ? p.value : JSON.stringify(p.value),
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      const dedup = new Set<string>();
      logsDedupRef.current = dedup;
      normalized.forEach((l) => dedup.add(`${l.timestamp}|${l.value}`));
      setLogs(normalized);
    } catch (e) {
      console.error("fetchLogsHistory error:", e);
    }
  };

  // const fetchRealtimeData = async () => {
  //   if (!deviceId) return;

  //   try {
  //     console.log("Fetching initial realtime data for:", deviceId);
  //     const result = await api.getDeviceRealtime(deviceId);
  //     console.log("Initial realtime data result:", result);

  //     if (result) {
  //       setRealtimeData(result);
  //       generateTelemetryWidgets(result);
  //       setLastUpdated(new Date());
  //     }
  //   } catch (error) {
  //     console.error("Initial realtime data fetch error:", error);
  //     // Fallback to live data if regular realtime fails
  //     await fetchLiveData();
  //   }
  // };

// const fetchLiveData = async (role?: "admin" | "user") => {
//   if (!deviceId) return;

//   try {
//     // use tighter 10-second window
//     const liveData = await api.getDeviceLiveData(
//       deviceId,
//       undefined,
//       10,
//       role
//     );
//     const keysData = liveData?.data || {};
//     const now = Date.now();

//     // keep only telemetry marked as isLive=true
//     const filteredTelemetry: Record<string, any> = {};
//     Object.entries(keysData).forEach(([key, val]: any) => {
//       if (val?.isLive === true) filteredTelemetry[key] = val;
//     });

//     Object.entries(keysData).forEach(([key, val]: any) => {
//       if (val?.isLive === true && key.toLowerCase().includes("logs")) {
//         pushLog(val.timestamp ?? Date.now(), val.value);
//       }
//     });

//     const isOnline = Object.keys(filteredTelemetry).length > 0;

//     setDevice((prev) =>
//       prev
//         ? {
//             ...prev,
//             status: isOnline ? "online" : "offline",
//             lastSeen: isOnline ? prev.lastSeen : "No recent telemetry",
//           }
//         : prev
//     );

//     // ⛔ if offline, clear telemetry widgets
//     if (!isOnline) {
//       setRealtimeData({
//         deviceId,
//         timestamp: now,
//         telemetry: {},
//         attributes: deviceAttributes?.attributes ?? {},
//         keys: [],
//       });
//       setTelemetryWidgets([]);
//       return;
//     }

//     // ✅ online: update real-time state
//     setRealtimeData({
//       deviceId: liveData.deviceId,
//       timestamp: now,
//       telemetry: filteredTelemetry,
//       attributes:
//         realtimeData?.attributes ?? deviceAttributes?.attributes ?? {},
//       keys: Object.keys(filteredTelemetry),
//     });

//     setLastUpdated(new Date());
//   } catch (error) {
//     console.error("Live data fetch error:", error);

//     // Handle expired token or missing session
//     const user = JSON.parse(localStorage.getItem("user") || "null");
//     if (!user) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       localStorage.removeItem("customerId");
//       navigate("/");
//     }
//   }
// };

  
  const fetchLiveData = async (role?: "admin" | "user") => {
    if (!deviceId) return;

    try {
      const live = await api.getDeviceLiveData(deviceId, undefined, 60, role);
      const groups = live?.groups || {};
      // ⛔ Filter out stale telemetry older than 30 seconds
      Object.keys(groups).forEach((groupName) => {
        const group = groups[groupName];
        Object.keys(group).forEach((key) => {
          const item = group[key];
          if (!item || Date.now() - item.ts > 30_000) {
            delete group[key];
          }
        });
        // remove empty groups
        if (Object.keys(group).length === 0) {
          delete groups[groupName];
        }
      });

      // const isOnline = Object.keys(groups).length > 0;

      const isOnline = !!(
        (
          live?.isLive &&
          live?.dataCount > 0 &&
          live?.timestamp &&
          Date.now() - live.timestamp < 30_000
        ) // 30s live window
      );

      setDevice((prev) =>
        prev ? { ...prev, status: isOnline ? "online" : "offline" } : prev
      );

      // Store groups in realtimeData
      setRealtimeData({
        deviceId,
        timestamp: live?.timestamp ?? Date.now(),
        telemetry: groups,
        attributes: deviceAttributes?.attributes ?? {},
        keys: live?.keys ?? [],
      });
    } catch (err) {
      console.error("fetchLiveData error:", err);
    }
  };




  // Read an attribute by key from TB attributes that may be an array [{key,value}] or an object
  const readAttr = (attrs: any, key: string) => {
    if (!attrs) return undefined;
    if (Array.isArray(attrs)) {
      const rec = attrs.find((a: any) => a?.key === key);
      return rec?.value;
    }
    if (typeof attrs === "object") {
      const v = (attrs as any)[key];
      return v && typeof v === "object" && "value" in v ? (v as any).value : v;
    }
    return undefined;
  };


  const fetchDeviceAttributes = async (role?: "admin" | "user") => {
    if (!deviceId) return;

    try {
      setIsLoadingAttributes(true);
      console.log("Fetching device attributes for:", deviceId);

      // Fetch server attributes
      const result = await api.getDeviceAttributes(
        deviceId,
        "SERVER_SCOPE",
        role
      );
      console.log("Device attributes result:", result);

      if (result && result.attributes) {
        setDeviceAttributes(result);
        const lastAct = readAttr(result.attributes, "lastActivityTime");
        if (typeof lastAct === "number") {
          setDevice((prev) =>
            prev ? { ...prev, lastSeen: formatRelativeTime(lastAct) } : prev
          );
        }
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

  const fetchRealDeviceData = async (role?: "admin" | "user") => {
    try {
      if (!deviceId) return;

      console.log("Fetching device info for:", deviceId);
      const deviceResult = await api.getDeviceInfo(deviceId, role);
      console.log("Device info result:", deviceResult);

      if (deviceResult.error) {
        throw new Error(deviceResult.error);
      }

      const deviceInfo = deviceResult;
      const transformedDevice: DeviceInfo = {
        id: deviceInfo.id?.id || deviceId,
        name: deviceInfo.name || "Unknown Device",
        type: deviceInfo.type || "Unknown Type",
        status: "offline",
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

      // await fetchRealtimeData();
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

  const fetchHistoricalData = async (role?: "admin" | "user") => {
    if (!deviceId) return;
    try {
      console.log("Fetching historical data for:", deviceId);
      const result = await api.getDeviceHistory(deviceId, undefined, 24, role);
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

  const fetchTelemetryHistory = async (keys: string[], hours = 24) => {
    if (!deviceId || keys.length === 0) return;
    try {
      setIsChartLoading(true);
      const res = await api.getDeviceHistory(deviceId, keys.join(","), hours);
      if (res?.data) {
        const parsed: Record<string, any[]> = {};
        Object.entries(res.data).forEach(([key, arr]: any) => {
          parsed[key] = arr.map((p: any) => ({
            time: new Date(p.timestamp),
            value: p.value,
          }));
        });
        setTelemetryHistory(parsed);
      }
    } catch (e) {
      console.error("Error fetching telemetry history:", e);
    } finally {
      setIsChartLoading(false);
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

  // Build { s1: "Energy Meter", s2: "..." } from server attribute "mb_attr"
  const getSensorNameMapFromAttributes = (): Record<string, string> => {
    const map: Record<string, string> = {};
    const attrs = deviceAttributes?.attributes;

    // TB can return attributes as an array [{key, value, lastUpdateTs}, ...] or an object
    let mbAttr: any;

    if (Array.isArray(attrs)) {
      const rec = attrs.find((a: any) => a?.key === "mb_attr");
      mbAttr = rec?.value;
    } else if (attrs && typeof attrs === "object") {
      // if your backend ever normalizes attributes to an object
      mbAttr = (attrs as any).mb_attr;
    }

    // mb_attr might be a JSON string
    if (typeof mbAttr === "string") {
      try {
        mbAttr = JSON.parse(mbAttr);
      } catch {
        /* ignore parse error */
      }
    }

    // Expected: [{ sid: 1, name: "Energy Meter", data: [...] }, ...]
    if (Array.isArray(mbAttr)) {
      for (const item of mbAttr) {
        if ((item?.sid ?? null) !== null && item?.name) {
          map[`s${item.sid}`] = String(item.name);
        }
      }
    }

    return map;
  };

  // Read sensor names from telemetry keys like "s1/dev_name"
  const getSensorNameMapFromTelemetry = (
    telemetry: Record<string, { value: any; timestamp: number }>
  ): Record<string, string> => {
    const map: Record<string, string> = {};
    Object.entries(telemetry || {}).forEach(([key, val]) => {
      const m = key.match(/^(s\d+)\/dev_name$/i);
      if (m && val && val.value != null) {
        map[m[1].toLowerCase()] = String(val.value);
      }
    });
    return map;
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
      groupedBySensor.get(sensorSystem)!.push({ key, data: telemetryData });
    });

    // Build name maps from telemetry and attributes.
    // Prefer telemetry-provided names (s1/dev_name) but fall back to mb_attr.
    const teleNameMap = getSensorNameMapFromTelemetry(data.telemetry);
    const attrNameMap = getSensorNameMapFromAttributes();
    const nameMap = { ...attrNameMap, ...teleNameMap }; // telemetry wins if both exist

    groupedBySensor.forEach((parameters, sensorSystem) => {
      const displayName =
        sensorSystem === "internal"
          ? "Internal Data"
          : nameMap[sensorSystem] ||
            `Sensor System ${sensorSystem.toUpperCase()}`;

      const widget: TelemetryWidget = {
        key: sensorSystem,
        displayName,
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
    console.log("Sensor name map used for titles:", nameMap);
  };

  // FIXED: More flexible sensor system extraction
  // const extractSensorSystem = (key: string): string => {
  //   // Check for existing s1/ pattern first
  //   const slashMatch = key.match(/^(s\d+)\//);
  //   if (slashMatch) return slashMatch[1];

  //   // More flexible pattern matching - use substring contains instead of exact matches
  //   const lowerKey = key.toLowerCase();

  //   // Group S1 parameters more flexibly
  //   if (
  //     lowerKey.includes("v1n") ||
  //     lowerKey.includes("v2n") ||
  //     lowerKey.includes("v3n") ||
  //     lowerKey.includes("i1") ||
  //     lowerKey.includes("i2") ||
  //     lowerKey.includes("i3") ||
  //     lowerKey.includes("units2") ||
  //     lowerKey.includes("units3") ||
  //     lowerKey.includes("frequency") ||
  //     lowerKey.includes("power factor 1")
  //   ) {
  //     return "s1";
  //   }

  //   // Group S2 parameters
  //   if (
  //     lowerKey.includes("v4n") ||
  //     lowerKey.includes("v5n") ||
  //     lowerKey.includes("v6n") ||
  //     lowerKey.includes("power factor 2")
  //   ) {
  //     return "s2";
  //   }

  //   // Fallback for anything else with voltage/current
  //   if (lowerKey.includes("voltage") || lowerKey.includes("current")) {
  //     return "s1"; // Default electrical parameters to s1
  //   }

  //   return "unknown";
  // };

  // Put s1/..., s2/... into those buckets. Everything else -> "internal".
  const extractSensorSystem = (key: string): string => {
    // sX/ prefix (e.g., s1/Voltage V1N)
    const slashMatch = key.match(/^(s\d+)\//);
    if (slashMatch) return slashMatch[1];

    const lowerKey = key.toLowerCase();

    // Heuristics for s1 & s2 when prefix is missing in the key text
    if (
      lowerKey.includes("v1n") ||
      lowerKey.includes("v2n") ||
      lowerKey.includes("v3n") ||
      lowerKey.includes("i1") ||
      lowerKey.includes("i2") ||
      lowerKey.includes("i3") ||
      lowerKey.includes("frequency") ||
      lowerKey.includes("power factor 1") ||
      lowerKey.includes("units1") ||
      lowerKey.includes("units2") ||
      lowerKey.includes("units3")
    ) {
      return "s1";
    }
    if (
      lowerKey.includes("v4n") ||
      lowerKey.includes("v5n") ||
      lowerKey.includes("v6n") ||
      lowerKey.includes("power factor 2")
    ) {
      return "s2";
    }

    // Known internal/board-level keys
    if (
      lowerKey.startsWith("dev_") ||
      lowerKey.includes("free_heap") ||
      lowerKey.includes("up_time") ||
      lowerKey.includes("ota") ||
      lowerKey === "sid"
    ) {
      return "internal";
    }

    // Fallback: any key with no sX/ prefix goes to internal
    return "internal";
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
  
  const TelemetryChart = ({
    data,
    name,
    unit,
  }: {
    data: any[];
    name: string;
    unit: string;
  }) => (
    <div className="bg-card rounded-lg p-4 mb-4 border border-muted shadow-sm">
      <h3 className="text-base font-semibold mb-2 text-primary">
        {name}{" "}
        {unit && (
          <span className="text-muted-foreground text-sm">({unit})</span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => new Date(v).toLocaleTimeString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(v) => new Date(v).toLocaleString()}
            formatter={(v) => [v, name]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00BFFF"
            strokeWidth={2}
            dot={false}
          />
          <Brush dataKey="time" height={25} stroke="#00BFFF" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                  return;
                }
                if (from === "admin") navigate("/admin");
                else navigate("/devices");
              }}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                {device.name}
              </h1>
              <button
                onClick={() => {
                  setNewName(device.name);
                  setIsRenameOpen(true);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Rename Device"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <div
                className={`status-indicator ${getStatusColor(device.status)}`}
              ></div>
              <Badge
                variant={device.status === "online" ? "default" : "secondary"}
                className="capitalize text-xs"
              >
                {device.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Widgets */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"></div>
          {device.status === "online" && realtimeData?.telemetry ? (
            Object.entries(realtimeData.telemetry).map(
              ([groupName, params]) => (
                <div key={groupName} className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    {groupName}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(params)
                      .filter(
                        ([_, p]: any) => Date.now() - (p?.ts ?? 0) < 30_000
                      ) // show only recent
                      .map(([key, param]: [string, any]) => (
                        <Card
                          key={key}
                          className="rounded-lg bg-card border border-border shadow-sm hover:shadow-md"
                          onClick={() =>
                            navigate(
                              `/devices/${deviceId}/telemetry/${encodeURIComponent(
                                key
                              )}`,
                              {
                                state: { key }, // pass metric key to TelemetryDetailPage
                              }
                            )
                          }
                        >
                          <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                            <MetricCard
                              title={cleanMetricName(key.split("/")[1] || key)}
                              value={Number(param.value) || 0}
                              unit={param.unit || extractUnit(key)}
                              icon={getIconForKey(key)}
                              color={
                                key.toLowerCase().includes("temp")
                                  ? "#ff5c5c"
                                  : key.toLowerCase().includes("voltage")
                                  ? "#00FFAA"
                                  : key.toLowerCase().includes("current")
                                  ? "#00CCFF"
                                  : key.toLowerCase().includes("power")
                                  ? "#FFD700"
                                  : key.toLowerCase().includes("frequency")
                                  ? "#9D4EDD"
                                  : "#00FA9A"
                              }
                            />
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )
            )
          ) : (
            <Card className="industrial-card">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Fresh Telemetry Data Available
                </h3>
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

        {/* ✅ Admin-only Logs Section */}
        {role === "admin" && (
          <div className="space-y-6">
            <Card className="industrial-card">
              <CardHeader className="border-b border-border py-2">
                {/* make one full-width row */}
                <div className="flex w-full items-center justify-between">
                  {/* Left: title */}
                  <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                    Logs
                  </CardTitle>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogsHistory(24, 200)}
                    >
                      Refresh Logs
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logsDedupRef.current.clear();
                        setLogs([]);
                      }}
                    >
                      Clear
                    </Button>

                    {/* <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Showing {logs.length}{" "}
                      {logs.length === 1 ? "entry" : "entries"}
                    </span> */}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No logs available in the selected window.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((entry, idx) => (
                      <li
                        key={`${entry.timestamp}-${idx}`}
                        className="p-3 rounded border bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            <pre className="whitespace-pre-wrap break-words text-sm mt-1">
                              {entry.value}
                            </pre>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                              navigator.clipboard.writeText(entry.value)
                            }
                            title="Copy"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 🪄 Rename Device Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new device name"
              className="w-full"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newName.trim()) {
                  toast({
                    title: "Invalid Name",
                    description: "Please enter a valid device name.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  const res = await api.renameDevice(device.id, newName.trim());
                  if (res.success) {
                    toast({
                      title: "Device Renamed",
                      description: `Device renamed to "${newName.trim()}"`,
                    });
                    setDevice({ ...device, name: newName.trim() });
                    setIsRenameOpen(false);
                  }
                } catch (err) {
                  toast({
                    title: "Rename Failed",
                    description: "Unable to rename the device.",
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


// ✅ Icon selector based on telemetry key
const getIconForKey = (key: string): string => {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("temp")) return "Thermometer";
  if (lowerKey.includes("humidity")) return "Droplets";
  if (lowerKey.includes("voltage") || lowerKey.includes("volt")) return "Zap";
  if (lowerKey.includes("current") || lowerKey.includes("amp")) return "Activity";
  if (lowerKey.includes("frequency") || lowerKey.includes("freq")) return "Waveform";
  if (lowerKey.includes("power")) return "BatteryCharging";
  if (lowerKey.includes("light")) return "Sun";
  if (lowerKey.includes("relay")) return "ToggleRight";
  if (lowerKey.includes("units") || lowerKey.includes("energy")) return "Battery";
  return "Cpu"; // default fallback
};

// ✅ Clean metric label (removes trailing full unit names like Volts, Amps, Watts)
const cleanMetricName = (name: string): string => {
  return name
    .replace(/voltage/gi, "Voltage")  // normalize casing
    .replace(/current/gi, "Current")
    .replace(/power factor/gi, "PF")
    .replace(/frequency/gi, "Freq")
    // remove full unit words (anywhere in key)
    .replace(/\bvolts?\b/gi, "")
    .replace(/\bamps?\b/gi, "")
    .replace(/\bwatts?\b/gi, "")
    .replace(/\bkwh\b/gi, "")
    .replace(/\bunit[s]?\b/gi, "Units")
    .replace(/\s+/g, " ")  // collapse extra spaces
    .trim();
};


// ✅ Shorter and standardized unit symbols
const extractUnit = (key: string): string => {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("voltage") || lowerKey.includes("v1n") || lowerKey.includes("v2n") || lowerKey.includes("v3n"))
    return "V";
  if (lowerKey.includes("current") || lowerKey.includes("i1") || lowerKey.includes("i2") || lowerKey.includes("i3"))
    return "A";
  if (lowerKey.includes("temperature") || lowerKey.includes("temp"))
    return "°C";
  if (lowerKey.includes("humidity"))
    return "%";
  if (lowerKey.includes("power") || lowerKey.includes("watts"))
    return "W";
  if (lowerKey.includes("frequency") || lowerKey.includes("freq"))
    return "Hz";
  if (lowerKey.includes("unit") || lowerKey.includes("energy"))
    return "kWh";
  if (lowerKey.includes("relay") || lowerKey.includes("light"))
    return "";
  return ""; // default
};


export default DeviceDetail;
