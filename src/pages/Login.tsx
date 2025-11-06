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
          ? "https://api.garud.cloud/garud"
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
     

      {/* ---------- Main Section ---------- */}
      <main className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#070b14]">
        {/* 🌆 Background cityscape */}
        {/* <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/image.png')", // 🏙️ Add a dark-blue city image
          }}
        ></div> */}

        {/* 🔵 IoT glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1022]/95 via-[#0f1530]/60 to-transparent"></div>

        {/* ✨ Connected ray network */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="#3b82f6" strokeWidth="0.6">
            <line x1="100" y1="700" x2="600" y2="300" />
            <line x1="600" y1="300" x2="1100" y2="600" />
            <line x1="1100" y1="600" x2="1450" y2="400" />
            <circle cx="600" cy="300" r="3" fill="#60a5fa" />
            <circle cx="1100" cy="600" r="3" fill="#60a5fa" />
            <circle cx="1450" cy="400" r="3" fill="#60a5fa" />
            <circle cx="100" cy="700" r="3" fill="#60a5fa" />
          </g>
        </svg>

        {/* 🧠 Floating glow particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/70 rounded-full blur-sm animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.8}s`,
              }}
            ></div>
          ))}
        </div>

        
        {/* 🧊 Login card (right side) */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm md:max-w-md bg-[#0f1628]/80 backdrop-blur-lg rounded-2xl border border-blue-400/20 shadow-[0_0_30px_rgba(80,120,255,0.3)] p-8 md:mr-24 animate-fadeIn">
          <div className="w-full text-center mb-6">
            <img
              src="/yeti-logo.png"
              alt="Yeti Logo"
              className="mx-auto h-10 brightness-200"
            />
            <h2 className="text-2xl font-semibold text-white mt-4">
              Login to Yeti
            </h2>
            <p className="text-blue-300 text-sm mt-1">
              Industrial Intelligence Platform
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4 w-full">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="w-full p-2.5 rounded bg-[#141b2f] border border-blue-500/40 text-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-2.5 rounded bg-[#141b2f] border border-blue-500/40 text-white focus:ring-1 focus:ring-blue-400 focus:outline-none pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-300 transition"
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
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-white font-medium mt-4"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              Don’t have an account?{" "}
              <Link to="/register" className="text-blue-400 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
























