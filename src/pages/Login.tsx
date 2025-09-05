import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerId");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Access Denied",
        description:
          "Please enter both email and password to access the system",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);

    try {
      //  const apiUrl = `http://localhost:8080`;
      // Dynamic URL that works in both development and production
    const apiUrl =
      process.env.NODE_ENV === "production"
        ? "http://152.42.209.180:8000"
        : "http://localhost:8000";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("customerId", data.user.customerId);

        toast({
          title: "Access Granted",
          description: `Welcome to Yeti Insight, ${
            data.user.firstName || data.user.email
          }!`,
          duration: 2000,
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description:
            data.message ||
            "Invalid credentials. Please check your email and password.",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description:
          "Unable to connect to industrial control server. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <div className="mx-auto w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-center">
              Login
            </CardTitle>
            <CardDescription className="text-sm text-center">
              Enter your credentials
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background border border-input rounded focus:ring-1 focus:ring-ring focus:border-ring"
                  placeholder="test@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background border border-input rounded focus:ring-1 focus:ring-ring focus:border-ring pr-10"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

















