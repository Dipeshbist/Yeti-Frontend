import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { getCurrentUser, isAdmin } from "@/utils/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear previous tokens on mount
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerId");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Access Denied",
        description: "Please enter both email and password",
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
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { role } = data.user;

        if (role === "admin") {
          localStorage.setItem("adminToken", data.access_token);
          localStorage.setItem("adminUser", JSON.stringify(data.user));
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
        }

        // if (data.user.customerId)
        //   localStorage.setItem("customerId", data.user.customerId);

        toast({
          title: "Access Granted",
          description: `Welcome, ${data.user.firstName || data.user.email}!`,
        });

        navigate(role === "admin" ? "/admin" : "/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center">
              Login
            </CardTitle>
            <CardDescription className="text-sm text-center">
              Enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 text-sm border rounded 
             bg-white text-gray-900 
             dark:bg-gray-800 dark:text-gray-100
             placeholder-gray-400 dark:placeholder-gray-500
             focus:ring-1 focus:ring-ring focus:border-ring"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 text-sm border rounded 
             bg-white text-gray-900 
             dark:bg-gray-800 dark:text-gray-100
             placeholder-gray-400 dark:placeholder-gray-500
             focus:ring-1 focus:ring-ring focus:border-ring pr-10"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
              <p className="text-center text-sm text-muted-foreground mt-3">
                Don’t have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;


