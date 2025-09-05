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
        ? "https://api-yeti.nepaldigital.systems"
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
            {/* <div className="mx-auto w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-white" />
            </div> */}
            <div className="mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-20 h-9 text-blue-600"
                viewBox="0 0 1280 576.58"
                fill="currentColor"
              >
                <path d="M102.03,300.66C62.53,191.86,15.71,61.97.66,16.53-.63,12.57-.03,8.61,2.44,5.25,4.92,1.88,8.48,0,12.64,0h122.66c6.53,0,11.98,5.05,12.47,11.58l16.63,196.71c.4,4.95,4.85,8.61,9.8,8.61s9.41-3.56,9.8-8.61L200.54,11.58c.59-6.53,6.04-11.58,12.57-11.58h121.67c4.16,0,7.82,1.88,10.19,5.35,2.48,3.46,2.97,7.52,1.58,11.48-15.05,45.44-61.87,175.33-101.37,284.13Z" />
                <path d="M525.15,61.78c-39.5-108.8-86.32-238.69-101.37-284.13-1.39-3.96-.9-8.02,1.58-11.48,2.37-3.47,6.03-5.35,10.19-5.35h121.67c6.53,0,11.98,5.05,12.57,11.58l17.54,196.71c.4,4.95,4.85,8.61,9.8,8.61s9.41-3.56,9.8-8.61L623.56,11.58c.49-6.53,5.94-11.58,12.47-11.58H758.69c4.16,0,7.72,1.88,10.19,5.25,2.47,3.36,3.07,7.32,1.78,11.28-15.05,45.44-61.87,175.33-101.37,284.13-39.5,108.8-86.32,238.69-101.37,284.13-1.29,3.96-.69,7.92,1.78,11.28,2.47,3.37,6.03,5.25,10.19,5.25h122.66c6.53,0,11.98-5.05,12.47-11.58l16.63-196.71c.39-4.95,4.85-8.61,9.8-8.61s9.41,3.66,9.8,8.61l17.54,196.71c.59,6.53,6.04,11.58,12.57,11.58h121.67c4.16,0,7.82-1.88,10.19-5.25,2.48-3.36,2.97-7.32,1.58-11.28-15.05-45.44-61.87-175.33-101.37-284.13Z" />
                <path d="M1012.57,576.58h-121.67c-6.53,0-11.98-5.05-12.57-11.58L861.79,368.29c-.4-4.95-4.85-8.61-9.8-8.61s-9.41,3.66-9.8,8.61L825.56,565c-.49,6.53-5.94,11.58-12.47,11.58H690.43c-4.16,0-7.72-1.88-10.19-5.25-2.47-3.36-3.07-7.32-1.78-11.28,15.05-45.44,61.87-175.33,101.37-284.13,39.5-108.8,86.32-238.69,101.37-284.13,1.29-3.96.69-7.92-1.78-11.28C877.15,1.88,873.59,0,869.43,0H746.77c-6.53,0-11.98,5.05-12.47,11.58L717.67,208.29c-.39,4.95-4.85,8.61-9.8,8.61s-9.41-3.66-9.8-8.61L680.53,11.58C679.94,5.05,674.49,0,667.96,0H546.29c-4.16,0-7.82,1.88-10.19,5.25-2.48,3.36-2.97,7.32-1.58,11.28,15.05,45.44,61.87,175.33,101.37,284.13,39.5,108.8,86.32,238.69,101.37,284.13,1.39,3.96.9,8.02-1.58,11.48-2.37,3.37-6.03,5.31-10.19,5.31Z" />
                <path d="M1267.43,0H1149.76c-6.53,0-12.57,5.64-12.57,12.57v551.44c0,6.93,5.64,12.57,12.57,12.57h117.51c6.93,0,12.57-5.64,12.57-12.57V12.57C1280,5.64,1274.36,0,1267.43,0Z" />
              </svg>
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



















