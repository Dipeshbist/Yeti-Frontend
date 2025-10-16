import { Navigate } from "react-router-dom";
import { isLoggedIn, isAdmin } from "@/utils/auth";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  // accept either user or admin token
  return isLoggedIn() || isLoggedIn("admin") ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
};

export const AdminRoute = ({ children }: { children: JSX.Element }) => {
  // specifically require admin token
  if (!isLoggedIn("admin")) return <Navigate to="/" replace />;
  return isAdmin() ? children : <Navigate to="/dashboard" replace />;
};
