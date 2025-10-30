/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Droplets,
  Thermometer,
  Zap,
  Cpu,
  Activity,
  BatteryCharging,
  Sun,
  ToggleRight,
  Battery,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  icon?: string; // optional icon name
  color?: string;
}

export default function MetricCard({
  title,
  value,
  unit = "",
  icon = "Droplets",
  color = "#00BFFF",
}: MetricCardProps) {
  const IconMap: any = {
    Droplets,
    Thermometer,
    Zap,
    Cpu,
    Activity,
    BatteryCharging,
    Sun,
    ToggleRight,
    Battery,
  };

  const Icon = IconMap[icon] || Droplets;

  // ✅ Normalize unit words to short symbols (case-insensitive)
  const normalizeUnit = (rawUnit: string): string => {
    if (!rawUnit) return "";
    const u = rawUnit.toLowerCase().trim();

    if (u.includes("volt")) return "V";
    if (u.includes("amp")) return "A";
    if (u.includes("watt") || u.includes("power")) return "W";
    if (u.includes("hertz") || u.includes("hz") || u.includes("freq")) return "Hz";
    if (u.includes("temp") || u.includes("celsius") || u.includes("°")) return "°C";
    if (u.includes("humidity") || u.includes("percent") || u === "%") return "%";
    if (u.includes("kwh") || u.includes("energy") || u.includes("unit")) return "kWh";
    return rawUnit; // keep as-is if no match
  };

  const shortUnit = normalizeUnit(unit);

  return (
    <div
      className="
        flex flex-col items-center justify-center
        text-center w-full h-full
        bg-transparent
      "
    >
      {/* Title */}
      <h1 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate w-[90%]">
        {title}
      </h1>

      {/* Icon + Value + Unit */}
      <div className="flex items-center justify-center gap-2">
        <Icon size={25} color={color} />
        <p
          className="text-3xl sm:text-3xl font-bold whitespace-nowrap flex items-center gap-1 leading-tight"
          style={{ color }}
        >
          {Number.isFinite(value) ? value.toFixed(1) : "--"}
          <span className="text-lg font-medium text-muted-foreground">
            {shortUnit}
          </span>
        </p>
      </div>
    </div>
  );
}
