import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Activity, BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";


const Login = () => {
  const [email, setEmail] = useState("");
  const { theme } = useTheme();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl =
        process.env.NODE_ENV === "production"
          ? "https://api.garud.cloud"
          : "http://localhost:8000";

      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const { role } = data.user;
        if (role === "admin") {
          localStorage.setItem("adminToken", data.access_token);
          localStorage.setItem("adminUser", JSON.stringify(data.user));
        } else {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        toast({
          title: "Access Granted",
          description: `Welcome ${data.user.firstName || data.user.email}`,
        });
        navigate(role === "admin" ? "/admin" : "/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <header className="w-full py-4 px-8 flex items-center justify-between bg-background text-foreground transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img src="/yeti-logo.png" alt="Yeti Logo" className="h-8 yeti-logo" />
        </div>
        {/* <p className="text-sm opacity-80">
          Industrial IoT Intelligence Platform
        </p> */}
      </header>

      {/* ---------- Main Section ---------- */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col lg:grid lg:grid-cols-2 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden border border-border bg-card mx-auto transition-all duration-300">
          {/* Left Side Description */}
          <div className="flex flex-col justify-center items-start bg-gradient-to-tr from-blue-900 via-indigo-800 to-purple-700 text-white px-6 py-10 sm:px-8 md:px-10 lg:py-16 space-y-6 text-left">
            <div>
              <h2 className="text-3xl font-bold leading-tight">
                Industrial Intelligence for Modern IoT
              </h2>
              {/* <p className="mt-3 text-white/90">
                Harness the power of real-time telemetry, advanced analytics,
                and scalable automation. Yeti helps your organization
                make data-driven decisions with precision and speed.
              </p> */}
            </div>
            <ul className="space-y-3 text-sm mt-6">
              <li className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-md p-1.5">
                  <Shield className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Secure Multi-Tenant Architecture
                  </p>
                  <p className="text-xs text-white/80">
                    Enterprise-grade RBAC and encrypted access control.
                  </p>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-md p-1.5">
                  <Activity className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Real-Time Telemetry Visualization
                  </p>
                  <p className="text-xs text-white/80">
                    Live dashboards powered by precision IoT data.
                  </p>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-md p-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Actionable Reports & Predictive Analytics
                  </p>
                  <p className="text-xs text-white/80">
                    Export insights as CSV, or PDF to drive strategy.
                  </p>
                </div>
              </li>
            </ul>

            <p className="text-xs mt-6 text-white/70">
              © {new Date().getFullYear()} Yeti. All rights reserved.
            </p>
          </div>

          {/* Right Side Form */}
          <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:p-16">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
              <Card className="bg-card border border-border rounded-xl shadow-lg">
                <CardHeader className="pb-4 text-center">
                  <CardTitle className="text-xl font-semibold">Login</CardTitle>
                  <CardDescription>
                    Sign in to access your Yeti dashboard
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 mt-1 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full px-3 py-2 mt-1 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-10"
                          placeholder=" Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium text-sm transition-colors duration-200 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </button>

                    {/* Register link */}
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      Don’t have an account?{" "}
                      <Link
                        to="/register"
                        className="text-blue-600 hover:underline"
                      >
                        Create one
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="w-full py-3 px-6 text-center text-xs text-muted-foreground bg-background transition-colors duration-300">
        Powered by{" "}
        <span className="font-semibold text-primary">Garud Cloud</span> • Built
        with precision & reliability
      </footer>
    </div>
  );
};

export default Login;



















