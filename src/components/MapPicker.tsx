/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";

// Import custom pin image (you can use your own or this URL)
const defaultIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // 📍 blue map pin
  iconSize: [38, 38], // adjust size for visibility
  iconAnchor: [19, 38], // point of the pin
  popupAnchor: [0, -38], // tooltip position
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const redIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
  className: "marker-red",
});


export function MapPicker({
  lat,
  lng,
  onSelect,
}: {
  lat?: number | null;
  lng?: number | null;
  onSelect: (lat: number, lng: number, label?: string) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // 🔹 Reverse geocode helper
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await res.json();
      return data.display_name || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (mapRef.current) return;

    const timeout = setTimeout(() => {
      const container = document.getElementById("map-picker");
      if (!container) return;

      // ✅ Initialize map
      mapRef.current = L.map(container, {
        center: [lat || 27.7172, lng || 85.324],
        zoom: 8,
        zoomControl: true,
      });

      // 👇 Arrow cursor instead of grab hand
      mapRef.current.getContainer().style.cursor = "default";

      // ✅ Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // ✅ Create and add marker to map
      markerRef.current = L.marker([lat || 27.7172, lng || 85.324], {
        draggable: true,
        icon: defaultIcon,
      })
        .addTo(mapRef.current) // ← this line ensures the marker is visible
        .on("dragend", async (e) => {
          const pos = (e.target as L.Marker).getLatLng();

          // Immediate update so Save button works
          onSelect(pos.lat, pos.lng, "Loading address...");

          // Reverse geocode for address
          const label = await reverseGeocode(pos.lat, pos.lng);
          onSelect(pos.lat, pos.lng, label);
        });

      // ✅ Click anywhere to move the marker
mapRef.current.on("click", async (e: any) => {
  const { lat, lng } = e.latlng;
  if (markerRef.current) {
    markerRef.current.setLatLng([lat, lng]).setIcon(redIcon);
  }
  const label = await reverseGeocode(lat, lng);
  onSelect(lat, lng, label);
});


      // ✅ Add search bar
      const provider = new OpenStreetMapProvider();
      // @ts-ignore
      const searchControl: any = new (GeoSearchControl as any)({
        provider,
        style: "bar",
        showMarker: false,
        autoClose: true,
        retainZoomLevel: false,
        searchLabel: "Enter address",
        keepResult: false,
        updateMap: true,
      });

      mapRef.current.addControl(searchControl);

      // ✅ Handle search location selection
      mapRef.current.on("geosearch/showlocation", (e: any) => {
        const { x, y, label } = e.location;
        markerRef.current?.setLatLng([y, x]);
        mapRef.current?.setView([y, x], 14);
        onSelect(y, x, label);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [lat, lng, onSelect]);

  return (
    <div
      id="map-picker"
      className="w-full h-[70vh] min-h-[500px] rounded-lg border border-border overflow-hidden"
    ></div>
  );
}
