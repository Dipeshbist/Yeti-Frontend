import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  Cpu, 
  Activity, 
  Thermometer, 
  Zap, 
  TrendingUp,
  MoreVertical,
  Eye,
  Settings
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CustomerDevice {
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

interface CustomerDashboard {
  id: string
  name: string
  description: string
  deviceCount: number
  lastUpdated: string
}

const Dashboard = () => {
  const [devices, setDevices] = useState<CustomerDevice[]>([])
  const [dashboards, setDashboards] = useState<CustomerDashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const customerId = localStorage.getItem("customerId")
    if (!customerId) {
      navigate("/")
      return
    }

    fetchCustomerData(customerId)
  }, [navigate])

  const fetchCustomerData = async (customerId: string) => {
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
          }
        ])

        setDashboards([
          {
            id: "dash-1",
            name: "Production Overview",
            description: "Main production line monitoring",
            deviceCount: 12,
            lastUpdated: "2 minutes ago"
          },
          {
            id: "dash-2", 
            name: "Environmental Control",
            description: "HVAC and climate monitoring",
            deviceCount: 8,
            lastUpdated: "1 minute ago"
          }
        ])
        
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online"
      case "warning": return "Warning"
      case "offline": return "Offline"
      default: return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <Card key={i} className="industrial-card animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground">Monitor your industrial devices and systems</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="telemetry-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold text-foreground">{devices.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="telemetry-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Online Devices</p>
                  <p className="text-2xl font-bold text-success">
                    {devices.filter(d => d.status === "online").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="telemetry-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Temperature</p>
                  <p className="text-2xl font-bold text-accent">
                    {(devices.reduce((acc, d) => acc + (d.telemetry.temperature || 0), 0) / devices.length).toFixed(1)}°C
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Thermometer className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="telemetry-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-warning">
                    {devices.filter(d => d.status === "warning").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboards Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Your Dashboards</h2>
            <Button className="industrial-button">
              Create Dashboard
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id} className="telemetry-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <CardDescription>{dashboard.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{dashboard.deviceCount} devices</Badge>
                      <span className="text-sm text-muted-foreground">
                        Updated {dashboard.lastUpdated}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Devices Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Recent Devices</h2>
            <Button 
              variant="outline" 
              onClick={() => navigate("/devices")}
              className="gap-2"
            >
              <Cpu className="w-4 h-4" />
              View All Devices
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id} className="telemetry-card cursor-pointer"
                    onClick={() => navigate(`/devices/${device.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{device.name}</CardTitle>
                      <CardDescription>{device.type}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`status-indicator ${getStatusColor(device.status)}`}></div>
                      <span className="text-xs text-muted-foreground">
                        {getStatusText(device.status)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground">{device.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Seen:</span>
                      <span className="text-foreground">{device.lastSeen}</span>
                    </div>
                    
                    {device.telemetry.temperature && (
                      <div className="flex items-center gap-2 text-sm">
                        <Thermometer className="w-4 h-4 text-accent" />
                        <span className="text-accent font-medium">
                          {device.telemetry.temperature}°C
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard