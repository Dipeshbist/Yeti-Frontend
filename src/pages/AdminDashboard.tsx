/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { adminThingsboardApi } from "@/services/api";

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
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateDevice, setShowCreateDevice] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showSelectCustomer, setShowSelectCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [customerDevices, setCustomerDevices] = useState<any[]>([]);
  const [showSelectDevice, setShowSelectDevice] = useState(false);
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [deviceProfiles, setDeviceProfiles] = useState<any[]>([]);


const [newCustomer, setNewCustomer] = useState({
  title: "",
  email: "",
  country: "",
  city: "",
});
const [newDevice, setNewDevice] = useState({
  name: "",
  // label: "",
  // type: "default",
  deviceProfileId: "ff0b6660-a596-11f0-a310-85b2fcee570f",
});
const [assignForm, setAssignForm] = useState({ customerId: "", deviceId: "" });
const [showCustomersList, setShowCustomersList] = useState(false);
const [showDevicesList, setShowDevicesList] = useState(false);
const [showAssignedList, setShowAssignedList] = useState(false);

const [customers, setCustomers] = useState<any[]>([]);
const [devices, setDevices] = useState<any[]>([]);
const [assignedDevices, setAssignedDevices] = useState<any[]>([]);


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
        fetch(`${baseUrl}/admin/tenant/dashboards`, { headers }), // admin’s own overview
        fetch(`${baseUrl}/admin/tenant/devices`, { headers }), // admin’s own overview
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
    const fetchProfiles = async () => {
      try {
        const res = await adminThingsboardApi.getDeviceProfiles();
        setDeviceProfiles(res.data || []);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load device profiles.",
          variant: "destructive",
        });
      }
    };
    fetchProfiles();
  }, []);


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
        <Card>
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowCreateCustomer(true)}>
              Create Customer
            </Button>
            <Button onClick={() => setShowCreateDevice(true)}>
              Create Device
            </Button>
            <Button onClick={() => setShowAssign(true)}>
              Assign Device & Customer ID
            </Button>

            <Button
              onClick={async () => {
                const res = await adminThingsboardApi.getAllCustomers();
                setCustomers(res.data?.data || res.data || []);
                setShowCustomersList(true);
              }}
            >
              View All Customers
            </Button>
            <Button
              onClick={async () => {
                const res = await adminThingsboardApi.getAllDevices();
                setDevices(res.data?.data || res.data || []);
                setShowDevicesList(true);
              }}
            >
              View All Devices
            </Button>
            <Button
              onClick={async () => {
                const res = await adminThingsboardApi.getAllCustomers();
                setCustomerList(res.data?.data || res.data || []);
                setShowSelectCustomer(true);
              }}
            >
              View Assigned Devices
            </Button>
          </CardContent>
        </Card>

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
                      } // open device detail page
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

        {/* Create Customer Modal */}
        {showCreateCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg space-y-3 shadow-lg">
              <h2 className="text-lg font-semibold">Create New Customer</h2>

              <Input
                placeholder="Customer Name"
                value={newCustomer.title}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, title: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
              />
              {/* <Input
                placeholder="Country"
                value={newCustomer.country}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, country: e.target.value })
                }
              />
              <Input
                placeholder="City"
                value={newCustomer.city}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, city: e.target.value })
                }
              /> */}

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateCustomer(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await adminThingsboardApi.createCustomer(newCustomer);
                      toast({ title: "Customer created successfully." });
                      setShowCreateCustomer(false);
                      setNewCustomer({
                        title: "",
                        email: "",
                        country: "",
                        city: "",
                      });
                    } catch (err) {
                      toast({
                        title: "Error creating customer",
                        description: String(err),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Device Modal */}
        {showCreateDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg space-y-3 shadow-lg">
              <h2 className="text-lg font-semibold">Create New Device</h2>

              <Input
                placeholder="Device Name"
                value={newDevice.name}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, name: e.target.value })
                }
              />
              {/* <Input
                placeholder="Label (optional)"
                value={newDevice.label}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, label: e.target.value })
                }
              />
              <Input
                placeholder="Type (default)"
                value={newDevice.type}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, type: e.target.value })
                }
              /> */}
              <Input
                placeholder="Device Profile ID"
                value={newDevice.deviceProfileId}
                onChange={(e) =>
                  setNewDevice({
                    ...newDevice,
                    deviceProfileId: e.target.value,
                  })
                }
              />

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDevice(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await adminThingsboardApi.createDevice({
                        name: newDevice.name,
                        // label: newDevice.label,
                        // type: newDevice.type,
                        deviceProfileId: {
                          id: newDevice.deviceProfileId,
                          entityType: "DEVICE_PROFILE",
                        },
                      });
                      toast({ title: "Device created successfully." });
                      setShowCreateDevice(false);
                      setNewDevice({
                        name: "",
                        // label: "",
                        // type: "default",
                        deviceProfileId: "",
                      });
                    } catch (err) {
                      toast({
                        title: "Error creating device",
                        description: String(err),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Device Modal */}
        {showAssign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg space-y-3 shadow-lg">
              <h2 className="text-lg font-semibold">
                Assign Device to Customer
              </h2>

              <label className="text-sm font-medium flex items-center justify-between">
                <span>Customer ID</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const res = await adminThingsboardApi.getAllCustomers();
                    setCustomers(res.data?.data || res.data || []);
                    setShowCustomersList(true);
                  }}
                >
                  Select Customer
                </Button>
              </label>

              <Input
                placeholder="Customer ID"
                value={assignForm.customerId}
                disabled={!!assignForm.customerId} // if filled from modal
                onChange={(e) =>
                  setAssignForm({ ...assignForm, customerId: e.target.value })
                }
              />

              <div>
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Device ID</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const res = await adminThingsboardApi.getAllDevices();
                        setDeviceList(res.data?.data || res.data || []);
                        setShowSelectDevice(true);
                      } catch (err) {
                        toast({
                          title: "Error fetching devices",
                          description: String(err),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Select Device
                  </Button>
                </label>

                <Input
                  placeholder="Device ID"
                  value={assignForm.deviceId}
                  disabled={!!assignForm.deviceId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, deviceId: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowAssign(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await adminThingsboardApi.assignDevice(
                        assignForm.customerId,
                        assignForm.deviceId
                      );
                      toast({ title: "Device assigned successfully." });
                      setShowAssign(false);
                      setAssignForm({ customerId: "", deviceId: "" });
                    } catch (err) {
                      toast({
                        title: "Error assigning device",
                        description: String(err),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Assign
                </Button>
              </div>
            </div>
          </div>
        )}

        {showCustomersList && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-4xl shadow-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">All Customers</h2>
              {customers.length ? (
                <table className="w-full text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Title</th>
                      <th className="text-left py-2">Email</th>
                      {/* <th>City</th>
                      <th>Country</th> */}
                      <th className="text-left py-2">Customer ID</th>
                      <th className="text-left py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-1 px-2">{c.title}</td>
                        <td className="py-1 px-2">{c.email || "—"}</td>
                        {/* <td>{c.city || "—"}</td>
                        <td>{c.country || "—"}</td> */}
                        <td className="py-1 px-2 font-mono text-xs">
                          {c.id?.id || c.id || "—"}
                        </td>
                        <td className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setAssignForm({
                                ...assignForm,
                                customerId: c.id?.id || c.id,
                              });
                              setShowCustomersList(false);
                              setShowAssign(true);
                              toast({
                                title: "Customer Selected",
                                description: `${c.title} (${c.id?.id}) selected.`,
                              });
                            }}
                          >
                            Select
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (confirm(`Delete customer "${c.title}"?`)) {
                                try {
                                  await adminThingsboardApi.deleteCustomer(
                                    c.id?.id || c.id
                                  );
                                  toast({
                                    title: "Customer deleted successfully.",
                                  });
                                  const refreshed =
                                    await adminThingsboardApi.getAllCustomers();
                                  setCustomers(refreshed.data?.data || []);
                                } catch (err) {
                                  toast({
                                    title: "Error deleting customer",
                                    description: String(err),
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No customers found.</p>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomersList(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDevicesList && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-4xl shadow-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">All Devices</h2>
              {devices.length ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      {/* <th>Label</th>
                      <th>Type</th> */}
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Active</th>
                      <th className="text-left py-2">Device ID</th>
                      <th className="text-left py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-1 px-2">{d.name}</td>
                        {/* <td>{d.label || "—"}</td>
                        <td>{d.type || "default"}</td> */}
                        <td className="py-1 px-2">
                          {d.customerTitle || "Unassigned"}
                        </td>
                        <td className="py-1 px-2">{d.active ? "✅" : "❌"}</td>
                        <td className="py-1 px-2 font-mono text-xs">
                          {d.id?.id}
                        </td>

                        <td className="flex gap-2">
                          {/* Select Button */}
                          <Button
                            size="sm"
                            onClick={() => {
                              setAssignForm({
                                ...assignForm,
                                deviceId: d.id?.id || "",
                              });
                              setShowDevicesList(false);
                              setShowAssign(true);
                              toast({
                                title: "Device Selected",
                                description: `${d.name} (${d.id?.id}) selected.`,
                              });
                            }}
                          >
                            Select
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (confirm(`Delete device "${d.name}"?`)) {
                                try {
                                  await adminThingsboardApi.deleteDevice(
                                    d.id?.id || ""
                                  );
                                  toast({
                                    title: "Device deleted successfully.",
                                  });
                                  const refreshed =
                                    await adminThingsboardApi.getAllDevices();
                                  setDevices(refreshed.data?.data || []);
                                } catch (err) {
                                  toast({
                                    title: "Error deleting device",
                                    description: String(err),
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No devices found.</p>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDevicesList(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAssignedList && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-3xl shadow-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                Devices Assigned to Customer
              </h2>
              {assignedDevices.length ? (
                <ul className="space-y-2">
                  {assignedDevices.map((d: any, i: number) => (
                    <li key={i} className="border p-2 rounded">
                      <strong>{d.name}</strong> ({d.type}) —{" "}
                      {d.deviceProfileName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No assigned devices found.</p>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignedList(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Select Customer Modal */}
        {showSelectCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-3xl shadow-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Select a Customer</h2>

              {customerList.length ? (
                <table className="w-full text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      {/* <th className="text-left py-2">City</th> */}
                      <th className="text-left py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerList.map((c: any) => (
                      <tr
                        key={c.id?.id || c.title}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="px-1 py-2">{c.title}</td>
                        <td className="px-1 py-2">{c.email || "—"}</td>
                        {/* <td>{c.city || "—"}</td> */}
                        <td>
                          {/* <Button
                            size="sm"
                            onClick={async () => {
                              setSelectedCustomer(c);
                              const res =
                                await adminThingsboardApi.getDevicesForCustomer(
                                  c.id?.id || c.id
                                );
                              setCustomerDevices(
                                res.data?.data || res.data || []
                              );
                            }}
                          >
                            View Devices
                          </Button> */}

                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                setSelectedCustomer(c);

                                // Clear previous devices
                                setCustomerDevices([]);

                                console.log(
                                  `Fetching devices for customer: ${c.title} (${
                                    c.id?.id || c.id
                                  })`
                                );

                                // Fetch devices with proper parameters
                                const res =
                                  await adminThingsboardApi.getDevicesForCustomer(
                                    c.id?.id || c.id,
                                    100, // pageSize
                                    0 // page
                                  );

                                console.log("Devices response:", res);

                                // Handle different response structures from ThingsBoard
                                let devices = [];
                                if (res.data?.data) {
                                  // PageData format: { data: [...], totalPages, totalElements, hasNext }
                                  devices = res.data.data;
                                } else if (Array.isArray(res.data)) {
                                  // Direct array format
                                  devices = res.data;
                                } else if (res.data) {
                                  // Single device object
                                  devices = [res.data];
                                }

                                console.log(
                                  `Found ${devices.length} devices for customer ${c.title}`
                                );

                                setCustomerDevices(devices);

                                if (devices.length === 0) {
                                  toast({
                                    title: "No Devices Found",
                                    description: `No devices are currently assigned to ${c.title}`,
                                  });
                                } else {
                                  toast({
                                    title: "Devices Loaded",
                                    description: `Found ${devices.length} device(s) for ${c.title}`,
                                  });
                                }
                              } catch (err) {
                                console.error("Error fetching devices:", err);
                                toast({
                                  title: "Error fetching devices",
                                  description:
                                    err instanceof Error
                                      ? err.message
                                      : String(err),
                                  variant: "destructive",
                                });
                                setCustomerDevices([]);
                              }
                            }}
                          >
                            View Devices
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No customers found.</p>
              )}

              {selectedCustomer && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold mb-2">
                    Devices Assigned to {selectedCustomer.title}
                  </h3>
                  {customerDevices.map((d: any) => (
                    <li
                      key={d.id?.id || d.id}
                      className="p-2 border rounded flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({d.type || d.deviceProfileName || "Unknown Type"})
                        </span>
                        {d.active !== undefined && (
                          <span className="ml-2 text-xs">
                            {d.active ? "✅ Active" : "❌ Inactive"}
                          </span>
                        )}
                        {d.label && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Label: {d.label}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (
                              confirm(
                                `Unassign device "${d.name}" from ${selectedCustomer.title}?`
                              )
                            ) {
                              try {
                                await adminThingsboardApi.unassignDevice(
                                  d.id?.id || d.id
                                );
                                toast({
                                  title: "Device Unassigned",
                                  description: `${d.name} has been unassigned from ${selectedCustomer.title}`,
                                });

                                // Refresh the devices list
                                const refreshed =
                                  await adminThingsboardApi.getDevicesForCustomer(
                                    selectedCustomer.id?.id ||
                                      selectedCustomer.id,
                                    100,
                                    0
                                  );
                                setCustomerDevices(
                                  refreshed.data?.data || refreshed.data || []
                                );
                              } catch (err) {
                                toast({
                                  title: "Error unassigning device",
                                  description: String(err),
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          Unassign
                        </Button>
                      </div>
                    </li>
                  ))}

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => {
                        setShowAssign(true);
                        setAssignForm({
                          ...assignForm,
                          customerId: selectedCustomer.id?.id,
                        });
                      }}
                    >
                      Assign New Device
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSelectCustomer(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Select Device Modal */}
        {showSelectDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-4xl shadow-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Select a Device</h2>

              {deviceList.length ? (
                <table className="w-full text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Device Name</th>
                      {/* <th>Type</th>
                      <th>Label</th> */}
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Device ID</th>
                      <th className="text-left py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceList.map((d: any) => (
                      <tr
                        key={d.id?.id || d.name}
                        className="border-b hover:bg-muted/50 transition"
                      >
                        <td className="py-1 px-2">{d.name}</td>
                        {/* <td>{d.type || "default"}</td>
                        <td>{d.label || "—"}</td> */}
                        <td className="py-1 px-2">
                          {d.customerTitle || "Unassigned"}
                        </td>
                        <td className="py-1 px-2 font-mono text-xs">
                          {d.id?.id}
                        </td>
                        <td className="py-1 px-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setAssignForm({
                                ...assignForm,
                                deviceId: d.id?.id || "",
                              });
                              setShowSelectDevice(false);
                              toast({
                                title: "Device Selected",
                                description: `${d.name} (${d.id?.id}) selected.`,
                              });
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No devices found.</p>
              )}

              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSelectDevice(false)}
                >
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
