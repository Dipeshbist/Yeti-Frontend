/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  role: string;
  customerId?: string | null;
  createdAt: string;
  isActive?: boolean;
}

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [myDashboards, setMyDashboards] = useState<any>(null);
  const [myDevices, setMyDevices] = useState<any>(null);
  const navigate = useNavigate();

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://api.garud.cloud"
      : "http://localhost:8000";

const fetchData = async () => {
  try {
    setLoading(true);
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/login");
      return;
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const [pendingRes, allRes, tenantDashRes, tenantDevRes] = await Promise.all(
      [
        fetch(`${baseUrl}/admin/users/pending`, { headers }),
        fetch(`${baseUrl}/admin/users/all`, { headers }),
        fetch(`${baseUrl}/admin/tenant/dashboards`, { headers }), // ✅ admin’s own overview
        fetch(`${baseUrl}/admin/tenant/devices`, { headers }), // ✅ admin’s own overview
      ]
    );

    const pending = await pendingRes.json();
    const all = await allRes.json();
    const tenantDash = await tenantDashRes.json();
    const tenantDev = await tenantDevRes.json();

    setPendingUsers(pending);
    setAllUsers(all);
    setMyDashboards(tenantDash);
    setMyDevices(tenantDev);
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to load users/tenant data.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Approve user
  const approveUser = async () => {
    if (!selectedUser || !customerId.trim()) {
      toast({
        title: "Missing Info",
        description: "Enter a valid ThingsBoard Customer ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const adminToken = localStorage.getItem("adminToken");
          if (!adminToken) {
            toast({
              title: "Authentication Failed",
              description: "Please log in again.",
              variant: "destructive",
            });
            navigate("/login"); // Redirect to login if adminToken is missing
            return;
          }

      const res = await fetch(`${baseUrl}/admin/users/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          customerId,
        }),
      });

      if (res.ok) {
        toast({
          title: "User Approved",
          description: `${selectedUser.email} has been verified.`,
        });
        setSelectedUser(null);
        setCustomerId("");
        fetchData(); // Reload data after approval
      } else {
        const data = await res.json();
        throw new Error(data.message || "Approval failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Server error",
        variant: "destructive",
      });
    }
  };

  // 🔹 Reject user
  const rejectUser = async (id: string) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`${baseUrl}/admin/users/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userId: id, reason }),
      });
      if (res.ok) {
        toast({
          title: "User Rejected",
          description: "User has been rejected.",
        });
        fetchData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject user.",
        variant: "destructive",
      });
    }
  };

  // 🔹 Delete user
  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`${baseUrl}/admin/users/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.ok) {
        toast({ title: "User Deleted", description: "User account removed." });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Server issue deleting user.",
        variant: "destructive",
      });
    }
  };

  // 🔹 View user dashboards/devices
const handleViewUser = async (user: User) => {
  setViewingUser(user);
  setUserDetails(null);

  try {
    const adminToken = localStorage.getItem("adminToken");
        if (!adminToken) {
          toast({
            title: "Authentication Failed",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate("/login"); // Redirect if no token is found
          return;
    }
    
    const headers = { Authorization: `Bearer ${adminToken}` };

    let dashboards, devices;

    if (user.role === "admin") {
      const [dashRes, devRes] = await Promise.all([
        fetch(`${baseUrl}/admin/tenant/dashboards`, { headers }),
        fetch(`${baseUrl}/admin/tenant/devices`, { headers }),
      ]);
      dashboards = await dashRes.json();
      devices = await devRes.json();
    } else if (user.customerId) {
      // ✅ Normal user target
      const [dashRes, devRes] = await Promise.all([
        fetch(`${baseUrl}/admin/users/${user.id}/dashboards`, { headers }),
        fetch(`${baseUrl}/admin/users/${user.id}/devices`, { headers }),
      ]);
      dashboards = await dashRes.json();
      devices = await devRes.json();
    } else {
      // No customerId and not admin (e.g., rejected/pending)
      toast({
        title: "No Customer ID",
        description: "This user has no assigned ThingsBoard customer.",
        variant: "destructive",
      });
      return;
    }

    setUserDetails({ dashboards, devices });
  } catch (err) {
     console.error("Error fetching user data:", err);
    toast({
      title: "Error",
      description: "Could not fetch user data.",
      variant: "destructive",
    });
  }
};
  if (loading)
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Pending Users */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No pending registrations.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border p-3 rounded"
                  >
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => setSelectedUser(user)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rejectUser(user.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Users */}
        <Card>
          <CardHeader>
            <CardTitle>All Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            {allUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users found.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Email</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Customer ID</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-2">{user.email}</td>
                      <td>{user.status}</td>
                      <td>{user.role}</td>
                      <td>{user.customerId || "—"}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="flex gap-2 py-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          Modify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Manage User Modal (Modify) */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-4">
                Manage User: {selectedUser.email}
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                    className="w-full border p-2 rounded bg-background text-foreground"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Customer ID</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded bg-background text-foreground"
                    value={selectedUser.customerId || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        customerId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedUser.isActive}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  <label>Active User</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    const adminToken = localStorage.getItem("adminToken");
                    const res = await fetch(
                      `${baseUrl}/admin/users/update/${selectedUser.id}`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${adminToken}`,
                        },
                        body: JSON.stringify({
                          role: selectedUser.role,
                          customerId: selectedUser.customerId,
                          isActive: selectedUser.isActive,
                        }),
                      }
                    );
                    if (res.ok) {
                      toast({
                        title: "User Updated",
                        description: "Changes saved successfully.",
                      });
                      setSelectedUser(null);
                      fetchData();
                    } else {
                      toast({
                        title: "Error",
                        description: "Failed to update user.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View User Modal (Full screen, no sidebar) */}
        {viewingUser && userDetails && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-2xl shadow-lg">
              <h2 className="text-lg font-semibold mb-4">
                User Details: {viewingUser.email}
              </h2>

              <div className="space-y-3 mb-4">
                <p>
                  <strong>Role:</strong> {viewingUser.role}
                </p>
                <p>
                  <strong>Customer ID:</strong> {viewingUser.customerId || "—"}
                </p>
                <p>
                  <strong>Status:</strong> {viewingUser.status}
                </p>
                <p>
                  <strong>Active:</strong> {viewingUser.isActive ? "Yes" : "No"}
                </p>
              </div>

              {/* Devices */}
              <h3 className="text-md font-semibold mb-2">Devices</h3>
              {userDetails.devices?.data?.length ? (
                <ul className="space-y-1">
                  {userDetails.devices.data.map((dev: any) => (
                    <li
                      key={dev.id.id}
                      className="p-2 border rounded flex justify-between items-center cursor-pointer hover:bg-muted/50 transition"
                      onClick={() =>
                        navigate(`/devices/${dev.id.id}`, {
                          state: { from: "admin" },
                        })
                      } // ✅ open device detail page
                    >
                      <span>{dev.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {dev.type}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No devices found for this user.
                </p>
              )}

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setViewingUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
