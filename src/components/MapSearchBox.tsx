/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MapSearchBox({
  onSelect,
}: {
  onSelect: (lat: number, lon: number, displayName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5`
      );
      const data = await resp.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search location on map..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="max-h-48 overflow-auto border rounded-md p-1 bg-popover shadow">
          {results.map((r) => (
            <button
              key={r.place_id}
              className="block w-full text-left px-2 py-1.5 hover:bg-muted rounded"
              onClick={() => {
                onSelect(Number(r.lat), Number(r.lon), r.display_name);
                setResults([]);
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
