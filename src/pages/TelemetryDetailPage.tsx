/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";

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
import { api } from "@/services/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function TelemetryDetailPage() {
  const { deviceId, system } = useParams();
  const location = useLocation();
  const selectedKey = (location.state as any)?.key;
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [telemetryHistory, setTelemetryHistory] = useState<
    Record<string, any[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState(12); // Default range 12h

  // ✅ Fetch telemetry history
const fetchTelemetryHistory = async (hrs = hours) => {
  if (!deviceId || !selectedKey) return;

  try {
    setIsLoading(true);

    const now = Date.now();
    const startTs = now - hrs * 3600 * 1000; // convert hours → milliseconds

    const res = await api.getDeviceHistory(
      deviceId,
      selectedKey,
      undefined, // ❌ do NOT send hours
      undefined, // role (optional)
      {
        // ⭐ Send actual time range
        startDate: startTs.toString(),
        endDate: now.toString(),
      }
    );

    if (res?.data) {
      const parsed: Record<string, any[]> = {};
      Object.entries(res.data).forEach(([key, arr]: any) => {
        parsed[key] = arr
          .map((p: any) => ({
            time: new Date(p.timestamp),
            value: p.value,
          }))
          .sort((a, b) => a.time.getTime() - b.time.getTime());
      });

      setTelemetryHistory(parsed);
    }
  } catch (e) {
    console.error("Error fetching telemetry history:", e);
    toast({
      title: "Error",
      description: "Failed to load telemetry data",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    fetchTelemetryHistory(hours);
  }, [deviceId, hours]);

  // ✅ Helper to dynamically compute ticks
  const computeTicks = (data: { time: Date }[]) => {
    if (!data || data.length === 0) return [];
    const totalPoints = data.length;
    // Fewer ticks when zoomed out
    const step =
      totalPoints > 400
        ? Math.floor(totalPoints / 20)
        : Math.floor(totalPoints / 10);
    return data.filter((_, i) => i % step === 0).map((d) => d.time.getTime());
  };

  // ✅ Auto-detect unit from telemetry key
  const detectUnit = (key: string): string => {
    const lower = key.toLowerCase();
    if (lower.includes("temp")) return "(°C)";
    if (lower.includes("humidity")) return "(%)";
    if (lower.includes("volt")) return "(V)";
    if (lower.includes("current") || lower.includes("amp")) return "(A)";
    if (lower.includes("power")) return "(W)";
    if (lower.includes("pressure")) return "(Pa)";
    if (lower.includes("heap")) return "(bytes)";
    if (lower.includes("freq")) return "(Hz)";
    return ""; // default if unknown
  };

  // ✅ Theme-safe color for labels
  const labelColor = theme === "dark" ? "#a3a3a3" : "#555";

  const safeTick = (v: any) => {
    try {
      const d = v instanceof Date ? v : new Date(v);
      return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };


  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <h1 className="text-xl font-bold text-foreground">
              {system ? system.split("/")[1] || system : "unknown"}
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Showing last <span className="font-semibold">{hours}h</span> of
              data
            </p>
          </div>
        </div>

        {/* Range selection buttons */}
        <div className="flex items-center gap-3">
          {[6, 12, 24, 48].map((h) => (
            <Button
              key={h}
              size="sm"
              variant={hours === h ? "default" : "outline"}
              onClick={() => setHours(h)}
            >
              {h}h
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTelemetryHistory(hours)}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Charts */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading telemetry data...
          </p>
        ) : Object.keys(telemetryHistory).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No telemetry data available.
          </p>
        ) : selectedKey && telemetryHistory[selectedKey] ? (
          <Card key={selectedKey} className="industrial-card">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 text-primary">
                {selectedKey.split("/")[1] || selectedKey}
              </h3>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={telemetryHistory[selectedKey]}
                  margin={{ top: 20, right: 30, bottom: 56, left: 96 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#333" : "#ccc"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    tickFormatter={safeTick}
                    ticks={computeTicks(telemetryHistory[selectedKey])}
                    tick={{ fill: labelColor, fontSize: 12 }}
                    tickMargin={12}
                    label={{
                      value: "Time (hh:mm)",
                      position: "bottom",
                      offset: 10,
                      style: {
                        fill: labelColor,
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                  />

                  <YAxis
                    width={1}
                    tick={{ fill: labelColor, fontSize: 12 }}
                    tickMargin={8}
                    label={{
                      value: `Value ${detectUnit(selectedKey)}`,
                      angle: -90,
                      position: "left",
                      offset: 56,
                      style: {
                        fill: labelColor,
                        fontSize: 12,
                        fontWeight: 500,
                        textAnchor: "middle",
                      },
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#111827" : "#ffffff", // dark gray or white
                      borderColor: "#00BFFF",
                      borderWidth: 1,
                      borderRadius: 8,
                    }}
                    itemStyle={{
                      color: "#00BFFF", // value text always blue
                      fontWeight: 500,
                    }}
                    labelStyle={{
                      color: theme === "dark" ? "#e5e7eb" : "#374151", // light gray in dark mode
                      fontWeight: 600,
                    }}
                    labelFormatter={(v) =>
                      new Date(v).toLocaleString("en-GB", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    }
                    formatter={(v) => [v, "value"]}
                  />

                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00BFFF"
                    strokeWidth={2}
                    dot={false}
                  />
                  {/* Move Brush BELOW by adjusting its y position */}
                  <Brush
                    dataKey="time"
                    height={25}
                    y={195} // place below the label (250 - 25)
                    stroke="#00BFFF"
                    tickFormatter={() => ""}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            No telemetry data available.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
