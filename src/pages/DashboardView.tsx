import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DashboardView = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
  }, [navigate]);

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard View</h1>
        <div className="w-full h-96 border rounded-lg">
          <iframe
            src={`http://152.42.209.180:8080/dashboard/${dashboardId}`}
            // src={`http://152.42.209.180:8080/dashboard/${dashboardId}?token=${localStorage.getItem(
            //   "token"
            // )}`}
            className="w-full h-full"
            title="ThingsBoard Dashboard"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardView;
