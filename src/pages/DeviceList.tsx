import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  Cpu, 
  Search,
  Filter,
  Activity,
  AlertTriangle,
  Thermometer,
  Droplets,
  Zap,
  MapPin,
  Clock
} from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  status: "online" | "offline" | "warning"
  lastSeen: string
  location: string
  telemetry: {
    temperature?: number
    humidity?: number
    voltage?: number
  }
}

const DeviceList = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const customerId = localStorage.getItem("customerId")
    if (!customerId) {
      navigate("/")
      return
    }
    fetchDevices(customerId)
  }, [navigate])

  useEffect(() => {
    let filtered = devices

    if (searchQuery) {
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(device => device.status === statusFilter)
    }

    setFilteredDevices(filtered)
  }, [devices, searchQuery, statusFilter])

  const fetchDevices = async (customerId: string) => {
    try {
      setIsLoading(true)
      
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setDevices([
          {
            id: "f0975620-7f26-11f0-a605-6b4e0db61b32",
            name: "Production Line A - Sensor 1",
            type: "Temperature Sensor",
            status: "online",
            lastSeen: "2 minutes ago",
            location: "Factory Floor 1",
            telemetry: { temperature: 24.5, humidity: 45.2, voltage: 12.1 }
          },
          {
            id: "78d99dc0-8244-11f0-a605-6b4e0db61b32",
            name: "HVAC Control Unit",
            type: "Climate Controller", 
            status: "online",
            lastSeen: "30 seconds ago",
            location: "Building B",
            telemetry: { temperature: 22.1, humidity: 38.7, voltage: 11.8 }
          },
          {
            id: "device-3",
            name: "Conveyor Belt Monitor",
            type: "Motion Sensor",
            status: "warning",
            lastSeen: "5 minutes ago",
            location: "Assembly Line",
            telemetry: { temperature: 28.3, voltage: 11.2 }
          },
          {
            id: "device-4",
            name: "Pressure Monitor A1",
            type: "Pressure Sensor",
            status: "online",
            lastSeen: "1 minute ago",
            location: "Boiler Room",
            telemetry: { temperature: 35.2, voltage: 12.0 }
          },
          {
            id: "device-5",
            name: "Air Quality Monitor",
            type: "Environmental Sensor",
            status: "offline",
            lastSeen: "2 hours ago",
            location: "Office Area",
            telemetry: { temperature: 21.8, humidity: 42.1, voltage: 10.5 }
          }
        ])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-success"
      case "warning": return "bg-warning"
      case "offline": return "bg-destructive"
      default: return "bg-muted"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <Activity className="w-4 h-4 text-success" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />
      case "offline": return <Cpu className="w-4 h-4 text-destructive" />
      default: return <Cpu className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
            <p className="text-muted-foreground">Monitor and manage all your connected devices</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search devices by name, type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              All ({devices.length})
            </Button>
            <Button
              variant={statusFilter === "online" ? "default" : "outline"}
              onClick={() => setStatusFilter("online")}
              className="gap-2"
            >
              <Activity className="w-4 h-4" />
              Online ({devices.filter(d => d.status === "online").length})
            </Button>
            <Button
              variant={statusFilter === "warning" ? "default" : "outline"}
              onClick={() => setStatusFilter("warning")}
              className="gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Warning ({devices.filter(d => d.status === "warning").length})
            </Button>
            <Button
              variant={statusFilter === "offline" ? "default" : "outline"}
              onClick={() => setStatusFilter("offline")}
              className="gap-2"
            >
              <Cpu className="w-4 h-4" />
              Offline ({devices.filter(d => d.status === "offline").length})
            </Button>
          </div>
        </div>

        {/* Device Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevices.map((device) => (
              <Card 
                key={device.id} 
                className="telemetry-card cursor-pointer"
                onClick={() => navigate(`/devices/${device.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{device.name}</CardTitle>
                      <CardDescription className="mt-1">{device.type}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(device.status)}
                      <div className={`status-indicator ${getStatusColor(device.status)}`}></div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Location & Last Seen */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{device.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{device.lastSeen}</span>
                      </div>
                    </div>

                    {/* Telemetry Data */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      {device.telemetry.temperature && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-accent" />
                          <div>
                            <div className="text-xs text-muted-foreground">Temp</div>
                            <div className="text-sm font-medium text-accent">
                              {device.telemetry.temperature}°C
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {device.telemetry.humidity && (
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">Humidity</div>
                            <div className="text-sm font-medium text-primary">
                              {device.telemetry.humidity}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {device.telemetry.voltage && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-warning" />
                          <div>
                            <div className="text-xs text-muted-foreground">Voltage</div>
                            <div className="text-sm font-medium text-warning">
                              {device.telemetry.voltage}V
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="pt-2">
                      <Badge 
                        variant={device.status === "online" ? "default" : 
                                device.status === "warning" ? "secondary" : "destructive"}
                        className="capitalize"
                      >
                        {device.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <Cpu className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No devices found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "No devices are currently connected to your account"
              }
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default DeviceList