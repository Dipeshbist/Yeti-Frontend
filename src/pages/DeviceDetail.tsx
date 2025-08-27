import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  ArrowLeft,
  Activity,
  Thermometer,
  Droplets,
  Zap,
  Clock,
  MapPin,
  Cpu,
  TrendingUp,
  RefreshCw,
  Play,
  Pause
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DeviceInfo {
  id: string
  name: string
  type: string
  status: "online" | "offline" | "warning"
  lastSeen: string
  location: string
  manufacturer: string
  model: string
  serialNumber: string
  firmwareVersion: string
}

interface TelemetryData {
  timestamp: string
  temperature?: number
  humidity?: number
  voltage?: number
}

const DeviceDetail = () => {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [realtimeData, setRealtimeData] = useState<TelemetryData | null>(null)
  const [historicalData, setHistoricalData] = useState<TelemetryData[]>([])
  const [isLivePolling, setIsLivePolling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!deviceId) return
    fetchDeviceData()
  }, [deviceId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLivePolling) {
      interval = setInterval(fetchRealtimeData, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLivePolling])

  const fetchDeviceData = async () => {
    try {
      setIsLoading(true)
      
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setDevice({
          id: deviceId!,
          name: "Production Line A - Sensor 1",
          type: "Temperature Sensor",
          status: "online",
          lastSeen: "2 minutes ago",
          location: "Factory Floor 1",
          manufacturer: "Yeti Industrial",
          model: "YTS-2024",
          serialNumber: "YTS-2024-001",
          firmwareVersion: "v2.1.3"
        })

        setRealtimeData({
          timestamp: new Date().toISOString(),
          temperature: 24.5,
          humidity: 45.2,
          voltage: 12.1
        })

        // Generate mock historical data
        const now = new Date()
        const mockData = []
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000)
          mockData.push({
            timestamp: time.toISOString(),
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 20,
            voltage: 11 + Math.random() * 2
          })
        }
        setHistoricalData(mockData)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      setIsLoading(false)
    }
  }

  const fetchRealtimeData = async () => {
    // Simulate real-time data updates
    setRealtimeData({
      timestamp: new Date().toISOString(),
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      voltage: 11 + Math.random() * 2
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-success"
      case "warning": return "bg-warning"
      case "offline": return "bg-destructive"
      default: return "bg-muted"
    }
  }

  const formatChartData = (data: TelemetryData[]) => {
    return data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }))
  }

  if (isLoading || !device) {
    return (
      <AppLayout>
        <div className="p-6 space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[1,2,3].map(i => (
                <Card key={i} className="industrial-card">
                  <CardContent className="p-6">
                    <div className="h-16 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/devices")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{device.name}</h1>
              <div className="flex items-center gap-2">
                <div className={`status-indicator ${getStatusColor(device.status)}`}></div>
                <Badge variant={device.status === "online" ? "default" : "secondary"} className="capitalize">
                  {device.status}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground">{device.type} • {device.location}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchDeviceData}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button 
              variant={isLivePolling ? "destructive" : "default"}
              onClick={() => setIsLivePolling(!isLivePolling)}
              className="gap-2"
            >
              {isLivePolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isLivePolling ? "Stop Live" : "Start Live"}
            </Button>
          </div>
        </div>

        {/* Real-time Telemetry Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="telemetry-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                  <p className="text-3xl font-bold text-accent">
                    {realtimeData?.temperature?.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Normal range</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Humidity</p>
                  <p className="text-3xl font-bold text-primary">
                    {realtimeData?.humidity?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Optimal level</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="telemetry-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Voltage</p>
                  <p className="text-3xl font-bold text-warning">
                    {realtimeData?.voltage?.toFixed(1)}V
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Stable</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">Historical Charts</TabsTrigger>
            <TabsTrigger value="info">Device Info</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            {/* Temperature Chart */}
            <Card className="industrial-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-accent" />
                  Temperature Trend (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData(historicalData)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="time" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Humidity Chart */}
            <Card className="industrial-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  Humidity Trend (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData(historicalData)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="time" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="industrial-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                      <p className="text-foreground font-mono text-sm">{device.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                      <p className="text-foreground">{device.manufacturer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Model</label>
                      <p className="text-foreground">{device.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                      <p className="text-foreground font-mono">{device.serialNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {device.location}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Firmware Version</label>
                      <p className="text-foreground">{device.firmwareVersion}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Seen</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {device.lastSeen}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2">
                        <div className={`status-indicator ${getStatusColor(device.status)}`}></div>
                        <Badge variant={device.status === "online" ? "default" : "secondary"} className="capitalize">
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw">
            <Card className="industrial-card">
              <CardHeader>
                <CardTitle>Raw Telemetry Data</CardTitle>
                <CardDescription>Latest real-time sensor readings</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(realtimeData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default DeviceDetail