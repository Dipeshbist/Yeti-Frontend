import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DashboardView = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams();

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const token =
    user?.role === "admin"
      ? localStorage.getItem("adminToken") || ""
      : localStorage.getItem("token") || "";

  useEffect(() => {
    if (!token || !user) {
      navigate("/");
      return;
    }
  }, [navigate, token, user]);

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard View</h1>
        <div className="w-full h-96 border rounded-lg">
          <iframe
            src={`http://72.60.205.104:8080/dashboard/${dashboardId}?token=${encodeURIComponent(
              token
            )}`}
            className="w-full h-full"
            title="ThingsBoard Dashboard"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardView;
