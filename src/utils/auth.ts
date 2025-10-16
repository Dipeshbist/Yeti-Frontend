export type CurrentUser = {
  id: string;
  email: string;
  role?: "admin" | "user";
  customerId?: string | null;
  firstName?: string;
  lastName?: string;
};

// Get token based on role
export const getToken = (role?: "admin" | "user") => {
  if (role === "admin") return localStorage.getItem("adminToken") || "";
  return localStorage.getItem("token") || "";
};

// Get current user based on role
export const getCurrentUser = (role?: "admin" | "user") => {
  try {
    const raw =
      role === "admin"
        ? localStorage.getItem("adminUser")
        : localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Check login based on role
export const isLoggedIn = (role?: "admin" | "user") => !!getToken(role);

// Check if admin
export const isAdmin = () => {
  const u = getCurrentUser("admin"); // ✅ reads adminUser key
  return !!u && u.role === "admin";
};
