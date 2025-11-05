/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Cpu } from "lucide-react";
import L from "leaflet";
import { renderToString } from "react-dom/server";


type Device = {
  id: string;
  name: string;
  status: "online" | "offline";
  location?: string;
  lat?: number | null;
  lng?: number | null;
};

// 🔹 Function that creates a Lucide "Cpu" icon styled for online/offline
const getDeviceIcon = (status: "online" | "offline", name: string) => {
  const color = status === "online" ? "#22c55e" : "#ef4444"; // Tailwind green/red
  const glow = status === "online"
    ? "0 0 15px rgba(34,197,94,0.6)"
    : "0 0 15px rgba(239,68,68,0.6)";

  // Convert React Lucide icon into SVG string
  const cpuIcon = renderToString(<Cpu color={color} size={22} />);

  return L.divIcon({
    className: "device-map-icon",
    html: `
      <div
        title="${name}"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:20px;
          height:20px;
          border-radius:8px;
          background:rgba(15, 23, 42, 0.9);
          border:1.5px solid ${color};
          box-shadow:${glow};
          cursor:pointer;
          transition:transform 0.2s ease, box-shadow 0.3s ease;
        "
      >
        ${cpuIcon}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};



function FitBounds({ devices }: { devices: Device[] }) {
  const map = useMap();

  useEffect(() => {
    const pts = devices
      .filter((d) => typeof d.lat === "number" && typeof d.lng === "number")
      .map((d) => [d.lat as number, d.lng as number]);

    if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts.map(([a, b]) => L.latLng(a, b))), {
        padding: [50, 50],
      });
    } else if (pts.length === 1) {
      map.setView(pts[0] as any, 11);
    }
  }, [devices, map]);

  return null;
}

export function DeviceMap({
  devices,
  onMarkerClick,
  flyToCenter,
}: {
  devices: Device[];
  onMarkerClick?: (id: string) => void;
  flyToCenter?: [number, number];
}) {
  // ✅ Smaller height for dashboard view
  const center = useMemo(() => {
    const first = devices.find((d) => d.lat && d.lng);
    return first
      ? [first.lat as number, first.lng as number]
      : [27.7172, 85.324];
  }, [devices]);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border">
      <MapContainer
        center={center as any}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <FitBounds devices={devices} />
        {devices
          .filter((d) => typeof d.lat === "number" && typeof d.lng === "number")
          .map((d) => (
            <Marker
              key={d.id}
              position={[d.lat as number, d.lng as number]}
              icon={getDeviceIcon(d.status, d.name)}
              eventHandlers={{
                click: () => onMarkerClick?.(d.id),
              }}
            >
              <Popup>
                <strong>{d.name}</strong>
                <br />
                Status:{" "}
                <span
                  className={
                    d.status === "online" ? "text-green-600" : "text-red-600"
                  }
                >
                  {d.status}
                </span>
                <br />
                {d.location && <span>{d.location}</span>}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
