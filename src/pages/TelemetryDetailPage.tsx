/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
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

export default function TelemetryDetailPage() {
  const { deviceId, system } = useParams();
  const navigate = useNavigate();

  const [telemetryHistory, setTelemetryHistory] = useState<
    Record<string, any[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState(12); // Default range 12h

  // ✅ Fetch telemetry history
  const fetchTelemetryHistory = async (hrs = hours) => {
    if (!deviceId) return;
    try {
      setIsLoading(true);
      const res = await api.getDeviceHistory(deviceId, undefined, hrs);
      if (res?.data) {
        const parsed: Record<string, any[]> = {};
        Object.entries(res.data).forEach(([key, arr]: any) => {
          parsed[key] = (arr as any[])
            .map((p) => ({
              time: new Date(p.timestamp),
              value: p.value,
            }))
            // ✅ Ensure oldest → newest (latest on right)
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
    return data.filter((_, i) => i % step === 0).map((d) => d.time);
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
              Internal Data{" "}
              <span className="text-muted-foreground">
                ({system ?? "unknown"})
              </span>
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
        ) : (
          Object.entries(telemetryHistory).map(([key, data]) => (
            <Card key={key} className="industrial-card">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  {key}
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#333"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(v) =>
                        new Date(v).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      }
                      interval="preserveStartEnd"
                      ticks={computeTicks(data)}
                    />
                    <YAxis />
                    <Tooltip
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
                    <Brush dataKey="time" height={25} stroke="#00BFFF" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
