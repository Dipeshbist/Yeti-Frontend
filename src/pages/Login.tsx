import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Shield, BarChart3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const Login = () => {
  const [customerId, setCustomerId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Customer ID",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("customerId", customerId)
      toast({
        title: "Login Successful",
        description: "Welcome to Yeti Insight Dashboard"
      })
      navigate("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Yeti Insight</h1>
              <p className="text-muted-foreground">Industrial IoT Dashboard</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Monitor Your Industrial 
              <span className="bg-gradient-accent bg-clip-text text-transparent"> Ecosystem</span>
            </h2>
            
            <p className="text-lg text-muted-foreground">
              Real-time telemetry, historical analytics, and comprehensive device management 
              in one powerful platform.
            </p>

            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <span className="text-foreground">Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <span className="text-foreground">Advanced analytics & insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground">Real-time monitoring</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md industrial-card">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-2xl font-bold">Access Your Dashboard</CardTitle>
              <CardDescription>
                Enter your Customer ID to view your devices and dashboards
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer ID</Label>
                  <Input
                    id="customerId"
                    type="text"
                    placeholder="e.g., 1692cc40-7d8f-11f0-84bb-ed3221ace2b1"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 industrial-button text-lg font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Connecting..." : "Access Dashboard"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Demo Customer ID: 1692cc40-7d8f-11f0-84bb-ed3221ace2b1
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Login