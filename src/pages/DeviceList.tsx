/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPicker } from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Cpu, Search, Filter, Activity, RefreshCw } from "lucide-react";
import { api } from "@/services/api.ts";
import { toast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSearchParams } from "react-router-dom";


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
  // const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);


  // ---------------------------------------------------
  // Initial Data Fetch
  // ---------------------------------------------------
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
        // close the search box when user clicks outside
        setShowSearch(false);
      }
    }

    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);

  // ---------------------------------------------------
  // Initialize and Fetch Device Data
  // ---------------------------------------------------
  const initializeDeviceList = async () => {
    try {
      setIsLoading(true);
      const devicesResult = await api.getMyDevices();
      if (devicesResult.error) throw new Error(devicesResult.error);

      const list = devicesResult.data || [];
      if (list.length === 0) {
        setDevices([]);
        toast({
          title: "No Devices Found",
          description: "No devices found for your account",
          variant: "destructive",
        });
        return;
      }

      const devicesWithTelemetry: Device[] = [];

      for (const deviceInfo of list) {
        try {
          const live = await api.getDeviceLiveData(
            deviceInfo.id.id,
            undefined,
            60
          );
          const isOnline = !!(
            live?.isLive &&
            live?.dataCount > 0 &&
            live?.timestamp &&
            Date.now() - live.timestamp < 30_000
          );

          const transformedDevice: Device = {
            id: deviceInfo.id.id,
            name: deviceInfo.name,
            type: deviceInfo.type,
            status: isOnline ? "online" : "offline",
            location: "Loading...",
            telemetry: {},
          };

          try {
            const locRes = await api.getDeviceLocation(deviceInfo.id.id);
            transformedDevice.location = locRes?.location || "Not set";
          } catch {
            transformedDevice.location = "Not set";
          }

          devicesWithTelemetry.push(transformedDevice);
        } catch {
          devicesWithTelemetry.push({
            id: deviceInfo.id.id,
            name: deviceInfo.name,
            type: deviceInfo.type,
            status: "offline",
            location: "Not set",
            telemetry: {},
          });
        }
      }

      setDevices(devicesWithTelemetry);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load device list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------
  // Helper: Save location handler
  // ---------------------------------------------------
  const saveLocation = async () => {
    if (!selectedDeviceId || lat == null || lng == null) {
      toast({
        title: "Select a location first",
        description: "Click or drag the marker on the map.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.saveDeviceLocation(selectedDeviceId, {
        location: locationName.trim() || "Unnamed Location",
        lat: Number(lat),
        lng: Number(lng),
      });

      toast({
        title: "Location Saved",
        description: `${locationName} (${lat.toFixed(4)}, ${lng.toFixed(
          4
        )}) has been saved.`,
      });

      setIsLocationDialogOpen(false);
      await initializeDeviceList();
    } catch (error) {
      console.error("Save location error:", error);
      toast({
        title: "Save Failed",
        description: "Unable to save device location.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------
  // UI Helper: Status badge colors
  // ---------------------------------------------------
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
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
      case "offline":
        return <Cpu className="w-4 h-4 text-destructive" />;
      default:
        return <Cpu className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // ---------------------------------------------------
  // Render
  // ---------------------------------------------------
  return (
    <AppLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Filters */}
        <div className="flex items-center justify-between w-full px-2 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="text-xs px-3 py-1.5 h-7 flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              All ({devices.length})
            </Button>
            <Button
              variant={statusFilter === "online" ? "default" : "outline"}
              onClick={() => setStatusFilter("online")}
              className="text-xs px-3 py-1.5 h-7 flex items-center gap-1"
            >
              <Activity className="w-3 h-3" />
              Online ({devices.filter((d) => d.status === "online").length})
            </Button>
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
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <CardTitle className="text-sm sm:text-base leading-tight truncate">
                        {device.name}
                      </CardTitle>
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
                <CardContent className="p-4 sm:p-5 pt-1">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between text-sm leading-relaxed">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground text-right max-w-[250px] break-words leading-relaxed">
                        {device.location || "Not set"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Location Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Search or click on the map to set your device location.
            </p>
          </DialogHeader>

          <Input
            placeholder="Location label (optional)"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />

          <MapPicker
            lat={lat}
            lng={lng}
            onSelect={(latVal, lonVal, label) => {
              setLat(latVal);
              setLng(lonVal);
              if (label && label !== "Loading address...")
                setLocationName(label);
            }}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLocationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveLocation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DeviceList;
