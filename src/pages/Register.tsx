import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Activity } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function getPasswordStrength(password: string) {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passed = [
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;

    let level = "Weak";
    let color = "text-red-500";
    if (passed >= 4) {
      level = "Strong";
      color = "text-green-500";
    } else if (passed === 3) {
      level = "Moderate";
      color = "text-yellow-500";
    }

    const message = [
      !minLength && "At least 8 characters",
      !hasUpper && "One uppercase letter",
      !hasLower && "One lowercase letter",
      !hasNumber && "One number",
      !hasSpecial && "One special symbol",
    ]
      .filter(Boolean)
      .join(", ");

    return { level, color, message };
  }

  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter your email and password.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl =
        process.env.NODE_ENV === "production"
          ? "https://api.garud.cloud/garud"
          : "http://localhost:8000";

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        toast({
          title: "Registration Submitted",
          description:
            "Your registration request has been sent to the admin. You will receive an email once approved.",
          duration: 4000,
        });

        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setPhone("");

        setTimeout(() => navigate("/"), 3000);
      } else {
        toast({
          title: "Registration Failed",
          description:
            data.message ||
            "Unable to register. Please check your details or try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please try again later.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <main className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#070b14]">
        {/* 🌆 Background cityscape */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/city-bg-dark.webp')",
          }}
        ></div>

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

        {/* 🧊 Register card */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm md:max-w-md bg-[#0f1628]/80 backdrop-blur-lg rounded-2xl border border-blue-400/20 shadow-[0_0_30px_rgba(80,120,255,0.3)] p-8 md:mr-24 animate-fadeIn">
          <div className="w-full text-center mb-6">
            <img
              src="/yeti-logo.png"
              alt="Yeti Logo"
              className="mx-auto h-10 brightness-200"
            />
            <h2 className="text-2xl font-semibold text-white mt-4">
              Create Your Yeti Account
            </h2>
            <p className="text-blue-300 text-sm mt-1">
              Industrial Intelligence Platform
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4 w-full">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                className="w-full p-2.5 rounded bg-[#141b2f] border border-blue-500/40 text-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                className="w-full p-2.5 rounded bg-[#141b2f] border border-blue-500/40 text-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full p-2.5 rounded bg-[#141b2f] border border-blue-500/40 text-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

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

              {/* Password strength */}
              {password &&
                (() => {
                  const { level, color, message } =
                    getPasswordStrength(password);
                  return (
                    <div className="mt-1 text-xs">
                      <p className={`font-medium ${color}`}>
                        Strength: {level}
                      </p>
                      {message && <p className="text-gray-400">{message}</p>}
                    </div>
                  );
                })()}
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-white font-medium mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register"}
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{" "}
              <Link to="/" className="text-blue-400 hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
