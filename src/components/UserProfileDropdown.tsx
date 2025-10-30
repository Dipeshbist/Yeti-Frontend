/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { User, LogOut, Mail, Building, Loader2 } from "lucide-react";
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
import { getCurrentUser, isAdmin } from "@/utils/auth";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "user";
  customerId?: string | null;
  profileImage?: string;
}

export const UserProfileDropdown = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const role = isAdmin() ? "admin" : "user";
      const localUser = getCurrentUser(role);
      const result = await api.getProfile(role);

      if (result.success && result.user) {
        setUserProfile(result.user);
      } else if (localUser) {
        setUserProfile(localUser);
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error: any) {
      console.error("Failed to load user profile:", error);

      // Clear tokens and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("customerId");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

const handleLogout = () => {
  const role = isAdmin() ? "admin" : "user";

  if (role === "admin") {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerId");
  }

  toast({
    title: "Logged Out",
    description: `Successfully logged out from ${role} account.`,
  });

  navigate("/");
};


  const getDisplayName = () => {
    if (!userProfile) return "Unknown User";
    if (userProfile.firstName && userProfile.lastName)
      return `${userProfile.firstName} ${userProfile.lastName}`;
    if (userProfile.firstName) return userProfile.firstName;
    return userProfile.email || "Unknown User";
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === "Unknown User") return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const getAccountType = () => {
    if (!userProfile) return "Customer Account";
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
              <Avatar
                className="h-8 w-8 cursor-pointer hover:opacity-80 transition"
                onClick={() => document.getElementById("avatarUpload")?.click()}
              >
                {userProfile?.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt="User Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                )}

                <input
                  type="file"
                  id="avatarUpload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      // 1️⃣ Upload to server
                      const result = await api.uploadAvatar(file);

                      // 2️⃣ Immediately refetch updated user from backend
                      const refreshed = await api.getProfile(
                        isAdmin() ? "admin" : "user"
                      );

                      // 3️⃣ Update local state with fresh data (forces re-render)
                      if (refreshed.success && refreshed.user) {
                        setUserProfile(refreshed.user);
                      }

                      toast({
                        title: "Profile Updated",
                        description: "Your avatar was uploaded successfully!",
                      });
                    } catch (err) {
                      console.error("Avatar upload failed:", err);
                      toast({
                        title: "Upload Failed",
                        description: "Something went wrong while uploading.",
                        variant: "destructive",
                      });
                    }
                  }}
                />
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

        {/* {userProfile?.customerId && (
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
        )} */}

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
