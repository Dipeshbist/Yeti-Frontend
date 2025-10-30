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
          ? "https://api.garud.cloud"
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
      {/* ---------- Header ---------- */}
      <header className="w-full py-4 px-8 flex items-center justify-between bg-background text-foreground transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img src="/yeti-logo.png" alt="Yeti Logo" className="h-8 yeti-logo" />
        </div>
        {/* <p className="text-sm opacity-80">
          Industrial IoT Intelligence Platform
        </p> */}
      </header>

      {/* ---------- Main Section ---------- */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden border border-border bg-card mx-auto transition-all duration-300">
          {/* Left Section (Info Panel) */}
          <div className="hidden md:flex flex-col justify-center items-start bg-gradient-to-tr from-blue-900 via-indigo-800 to-purple-700 text-white px-6 py-10 sm:px-8 md:px-10 lg:py-16 space-y-6 text-left">
            <div>
              <h2 className="text-3xl font-bold leading-tight">
                Industrial Intelligence for Modern IoT
              </h2>
              {/* <p className="mt-3 text-white/90">
                Harness the power of connected intelligence. Register now to
                access your personalized IoT dashboards and insights.
              </p> */}
            </div>

            <ul className="space-y-3 text-sm mt-6">
              {/* Secure Multi-Tenant Architecture */}
              <li className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-md p-1.5">
                  <Shield className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Secure Multi-Tenant Architecture
                  </p>
                  <p className="text-xs text-white/80">
                    Enterprise-grade security and access control.
                  </p>
                </div>
              </li>

              {/* Real-Time Telemetry Visualization */}
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

              {/* Actionable Reports & Predictive Analytics */}
              <li className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-md p-1.5">
                  <Activity className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Actionable Reports & Predictive Analytics
                  </p>
                  <p className="text-xs text-white/80">
                    Export insights as CSV, Excel, or PDF to drive strategy.
                  </p>
                </div>
              </li>
            </ul>

            <p className="text-xs mt-6 text-white/70">
              © {new Date().getFullYear()} Yeti. All rights reserved.
            </p>
          </div>

          {/* Right Section (Form) */}
          <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:p-16">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
              <Card className="bg-card border border-border rounded-xl shadow-lg">
                <CardHeader className="pb-4 text-center">
                  <CardTitle className="text-xl font-semibold">
                    Create Account
                  </CardTitle>
                  <CardDescription>
                    Register to access the Yeti platform
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full px-3 py-2 text-sm border rounded bg-gray-50 dark:bg-gray-800 text-foreground focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-10"
                          placeholder="Enter your Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
                      {isLoading ? "Registering..." : "Register"}
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      Already have an account?{" "}
                      <Link
                        to="/"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Sign In
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

export default Register;
