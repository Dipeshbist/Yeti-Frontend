import { useState, useEffect } from "react";
import {
  User,
  Settings,
  LogOut,
  UserCircle,
  Mail,
  Building,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  customerId: string;
}

export const UserProfileDropdown = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const result = await api.getProfile();

      if (result.success && result.data) {
        setUserProfile(result.data);
      } else {
        // Fallback to localStorage data if profile fetch fails
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUserProfile(parsedUser);
        }
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);

      // Fallback to localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUserProfile(parsedUser);
        } catch (parseError) {
          console.error("Failed to parse user data:", parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerId");

    setUserProfile(null);

    toast({
      title: "Logged Out",
      description:
        "Successfully logged out. You can now login with different credentials.",
    });

    navigate("/");
  };

  const handleProfile = () => {
    navigate("/settings");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  // Get display name and initials
  const getDisplayName = () => {
    if (!userProfile) return "Unknown User";

    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    } else if (userProfile.firstName) {
      return userProfile.firstName;
    } else {
      return userProfile.email || "Unknown User";
    }
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === "Unknown User") return "U";

    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0]?.charAt(0) + parts[1]?.charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAccountType = () => {
    if (!userProfile) return "Customer Account";

    // You can expand this based on your user roles
    return userProfile.customerId ? "Customer Account" : "User Account";
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">
                  {getAccountType()}
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {userProfile?.email && (
          <DropdownMenuItem className="cursor-pointer">
            <Mail className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm">Email</span>
              <span className="text-xs text-muted-foreground">
                {userProfile.email.length > 25
                  ? `${userProfile.email.substring(0, 25)}...`
                  : userProfile.email}
              </span>
            </div>
          </DropdownMenuItem>
        )}

        {userProfile?.customerId && (
          <DropdownMenuItem className="cursor-pointer">
            <Building className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm">Customer ID</span>
              <span className="text-xs text-muted-foreground font-mono">
                {userProfile.customerId.length > 20
                  ? `${userProfile.customerId.substring(0, 20)}...`
                  : userProfile.customerId}
              </span>
            </div>
          </DropdownMenuItem>
        )}

        {/* <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem> */}

        {/* <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem> */}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
