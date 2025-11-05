/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  RefreshCw,
} from "lucide-react";

// ---- helpers to export ----------
const toCSV = (rows: any[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h] ?? "";
          const needsQuote = /[,"\n]/.test(String(val));
          return needsQuote ? `"${String(val).replace(/"/g, '""')}"` : val;
        })
        .join(",")
    ),
  ].join("\n");
  return csv;
};

const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [hours, setHours] = useState<number>(24);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]); // flattened table rows

  // Load user devices for selector
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getMyDevices();
        const list = res?.data ?? [];
        setDevices(list);
        if (list.length) setDeviceId(list[0].id.id);
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load devices",
          variant: "destructive",
        });
      }
    })();
  }, []);

  // Fetch history for selected device + range
  const fetchReport = async () => {
    if (!deviceId) {
      toast({
        title: "Missing",
        description: "Please select a device",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsLoading(true);
      // no keys => all telemetry; hours controls range
      let res;

      if (startDate && endDate) {
        // ✅ Fetch based on date range
        res = await api.getDeviceHistory(
          deviceId,
          undefined,
          undefined,
          "admin",
          {
            startDate,
            endDate,
          }
        );
      } else {
        // fallback to hours if no range selected
        res = await api.getDeviceHistory(deviceId, undefined, hours);
      }

      const tele = res?.data || {};
      // Flatten into rows: {timeISO, key, value}
      const rows: any[] = [];
      Object.entries(tele).forEach(([key, arr]: any) => {
        (arr as any[]).forEach((p) => {
          rows.push({
            time: new Date(p.timestamp).toISOString(),
            key,
            value: p.value,
            deviceId,
          });
        });
      });
      // sort ascending time
      rows.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      setData(rows);
      toast({
        title: "Report ready",
        description: `${rows.length} records loaded.`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to fetch telemetry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = data.length > 0;
  const filenameBase = useMemo(() => {
    const d = devices.find((d) => d.id.id === deviceId);
    const name = d?.name ? d.name.replace(/\s+/g, "_") : "device";
    return `report_${name}_${hours}h`;
  }, [devices, deviceId, hours]);

  // Exporters
 const exportCSV = () => {
   if (!hasData) return;

   const d = devices.find((d) => d.id.id === deviceId);
   const deviceHeader = `Device Name: ${d?.name || "N/A"}, Device ID: ${
     d?.id?.id || "N/A"
   }\n\n`;

   // Omit deviceId column for CSV
   const cleaned = data.map(({ time, key, value }) => ({ time, key, value }));
   const csv = deviceHeader + toCSV(cleaned);

   downloadFile(
     new Blob([csv], { type: "text/csv;charset=utf-8" }),
     `${filenameBase}.csv`
   );
 };


const exportPDF = async () => {
  if (!hasData) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  // 🧾 Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Yeti — Telemetry Report", 14, 18);

  // 🧩 Device Info
  const d = devices.find((d) => d.id.id === deviceId);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Device Name: ${d?.name || "N/A"}`, 14, 28);
  doc.text(`Device ID: ${d?.id?.id || "N/A"}`, 14, 36);

  // 🧱 Table
  const headers = [["Time", "Key", "Value"]];
  const body = data.map((r) => [r.time, r.key, String(r.value)]);

  autoTable(doc, {
    head: headers,
    body,
    startY: 44, // 👈 Start table below device info
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [31, 58, 215] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // 💾 Save
  const filenameBase = d?.name
    ? `report_${d.name.replace(/\s+/g, "_")}`
    : "device_report";
  doc.save(`${filenameBase}.pdf`);
};


  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader className="pb-1">
            {/* <CardTitle>Reports</CardTitle> */}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Device */}
              <div className="space-y-1">
                <Label>Device</Label>
                <Select value={deviceId} onValueChange={(v) => setDeviceId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.id.id} value={d.id.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-1">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the start and end dates to fetch telemetry data within
                  that period.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={fetchReport}
                    disabled={!deviceId || isLoading}
                    className="gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Load
                  </Button>
                  <Button variant="outline" onClick={() => setData([])}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                onClick={exportCSV}
                disabled={!hasData}
                className="gap-2"
              >
                <FileText className="w-4 h-4" /> Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={exportPDF}
                disabled={!hasData}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" /> Export PDF
              </Button>
              {!hasData && (
                <p className="text-sm text-muted-foreground">
                  Load a report to enable exports.
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="overflow-auto rounded border mt-2">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Key</th>
                    <th className="text-left p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 200).map((r, i) => (
                    <tr key={`${r.time}-${i}`} className="border-t">
                      <td className="p-2 whitespace-nowrap">{r.time}</td>
                      <td className="p-2">{r.key}</td>
                      <td className="p-2">{String(r.value)}</td>
                    </tr>
                  ))}
                  {!data.length && (
                    <tr>
                      <td className="p-4 text-muted-foreground" colSpan={3}>
                        No data loaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
