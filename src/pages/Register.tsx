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

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
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

        // redirect back to login
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
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm text-center">
              Register to access the Yeti Insight platform
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm text-foreground bg-background border border-input rounded focus:ring-1 focus:ring-ring focus:border-ring"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm text-foreground bg-background border border-input rounded focus:ring-1 focus:ring-ring focus:border-ring"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 text-sm text-foreground bg-background border border-input rounded focus:ring-1 focus:ring-ring focus:border-ring"
                  placeholder="test@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 text-sm text-foreground bg-background border border-input rounded focus:ring-1 focus:ring-ring focus:border-ring"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </button>

              {/* Login link */}
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
  );
};

export default Register;
