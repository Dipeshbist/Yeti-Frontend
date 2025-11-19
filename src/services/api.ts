/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.garud.cloud/garud" // Backend server:
    : "http://localhost:8000";      // Local development

// Get token from localStorage
const getAuthToken = (role?: "admin" | "user") => {
  try {
    if (role === "admin") {
      return localStorage.getItem("adminToken") || "";
    }
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface DeviceInfo {
  id: { entityType: "DEVICE"; id: string };
  name: string;
  type: string;
  deviceProfileName: string;
  customerTitle?: string | null;
  active?: boolean;
  createdTime?: number;
}

export interface CustomerDashboard {
  id: { entityType: "DASHBOARD"; id: string };
  title: string;
  image?: string | null;
  assignedCustomers?: any[];
  mobileHide?: boolean;
  mobileOrder?: number;
}

export interface TelemetryData {
  deviceId: string;
  timestamp: number;
  telemetry: Record<string, { value: any; timestamp: number }>;
  attributes: Record<string, any>;
  keys: string[];
}

export interface PageData<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

// Customer API calls
export const customerApi = {
  async getDashboards(
    customerId: string,
    pageSize = 10,
    page = 0
  ): Promise<ApiResponse<PageData<CustomerDashboard>>> {
    try {
      const response = await fetch(
        `${BASE_URL}/customers/${customerId}/dashboards?pageSize=${pageSize}&page=${page}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getDashboards error:", error);
      return {
        data: { data: [], totalPages: 0, totalElements: 0, hasNext: false },
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async getDeviceInfos(
    customerId: string,
    pageSize = 10,
    page = 0
  ): Promise<ApiResponse<PageData<DeviceInfo>>> {
    try {
      const response = await fetch(
        `${BASE_URL}/customers/${customerId}/device-infos?pageSize=${pageSize}&page=${page}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getDeviceInfos error:", error);
      return {
        data: { data: [], totalPages: 0, totalElements: 0, hasNext: false },
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },
};

// Device API calls
export const deviceApi = {
  async getDeviceInfo(deviceId: string): Promise<ApiResponse<DeviceInfo>> {
    try {
      const response = await fetch(`${BASE_URL}/devices/info/${deviceId}`);
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getDeviceInfo error:", error);
      return {
        data: {} as DeviceInfo,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async getDeviceByName(name: string): Promise<ApiResponse<DeviceInfo>> {
    try {
      const response = await fetch(
        `${BASE_URL}/devices/by-name/${encodeURIComponent(name)}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getDeviceByName error:", error);
      return {
        data: {} as DeviceInfo,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async getMultipleDeviceInfos(
    deviceIds: string[]
  ): Promise<ApiResponse<DeviceInfo[]>> {
    try {
      const idsParam = deviceIds.join(",");
      const response = await fetch(
        `${BASE_URL}/devices/by-ids?ids=${encodeURIComponent(idsParam)}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getMultipleDeviceInfos error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async getRealtimeData(
    deviceId: string,
    keys?: string[]
  ): Promise<ApiResponse<TelemetryData>> {
    try {
      const keysParam = keys ? `?keys=${keys.join(",")}` : "";
      const response = await fetch(
        `${BASE_URL}/devices/${deviceId}/realtime${keysParam}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getRealtimeData error:", error);
      return {
        data: {} as TelemetryData,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async getHistoricalData(
    deviceId: string,
    keys?: string[],
    hours = 6,
    limit?: number
  ): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (keys && keys.length > 0) params.append("keys", keys.join(","));
      params.append("hours", hours.toString());
      if (limit) params.append("limit", limit.toString());

      const response = await fetch(
        `${BASE_URL}/devices/${deviceId}/history?${params}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("getHistoricalData error:", error);
      return {
        data: {},
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },
};

// Utility function to check if API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log(`Checking API health at: ${BASE_URL}/test/ping`);
    const response = await fetch(`${BASE_URL}/test/ping`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};

// Update apiCall to accept role
const apiCall = async (endpoint: string, options: RequestInit = {}, role?: "admin" | "user") => {
let token = getAuthToken(role);
if (!token) {
  // fallback for either role
  token =
    localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
}

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("customerId");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/";
    throw new Error("Authentication expired");
  }

  if (!response.ok) {
    const errorText = `Server returned ${response.status}: ${response.statusText}`;
    throw new Error(errorText);
  }

  return response.json();
};

export const api = {
  // Auth endpoints
  login: (email: string, password: string) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getProfile: (role?: "admin" | "user") => apiCall("/auth/profile", {}, role),

  // Protected device endpoints
  getMyDevices: (page = 0) => apiCall(`/my-devices?page=${page}`),

  getMyDashboards: (page = 0) => apiCall(`/my-dashboards?page=${page}`),

  getDeviceInfo: (deviceId: string, role?: "admin" | "user") =>
    apiCall(`/devices/${deviceId}/info`, {}, role),

  getDeviceRealtime: (deviceId: string, keys?: string) => {
    const url = keys
      ? `/devices/${deviceId}/realtime?keys=${keys}`
      : `/devices/${deviceId}/realtime`;
    return apiCall(url);
  },

  getDeviceHistory: (
    deviceId: string,
    keys?: string,
    hours = 24,
    role?: "admin" | "user",
    dateRange?: { startDate?: string; endDate?: string }
  ) => {
    const params = new URLSearchParams();

    // If date range provided, prioritize that
    if (dateRange?.startDate && dateRange?.endDate) {
      params.append("startDate", dateRange.startDate);
      params.append("endDate", dateRange.endDate);
    } else {
      params.append("hours", hours.toString());
    }

    if (keys) params.append("keys", keys);

    return apiCall(`/devices/${deviceId}/history?${params}`, {}, role);
  },

  // Add this new function for getting device attributes
  getDeviceAttributes: (
    deviceId: string,
    scope: "CLIENT_SCOPE" | "SERVER_SCOPE" | "SHARED_SCOPE" = "SERVER_SCOPE",
    role?: "admin" | "user"
  ) => {
    const url = `/devices/${deviceId}/attributes/${scope}`;
    return apiCall(url, {}, role);
  },

  // Add these new live data functions
  getDeviceLiveData: (
    deviceId: string,
    keys?: string[],
    maxAge: number = 30,
    role?: "admin" | "user"
  ) => {
    const keysParam = keys ? keys.join(",") : "";
    const url = keys
      ? `/devices/${deviceId}/live?keys=${keysParam}&maxAge=${maxAge}`
      : `/devices/${deviceId}/live?maxAge=${maxAge}`;
    return apiCall(url, {}, role);
  },

  async getDeviceFreshData(
    deviceId: string,
    keys?: string[],
    maxAge: number = 60
  ): Promise<TelemetryData> {
    const token = getAuthToken();
    const keysParam = keys ? keys.join(",") : "";

    const response = await fetch(
      `${BASE_URL}/devices/${deviceId}/fresh?keys=${keysParam}&maxAge=${maxAge}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Save device location (auto-fills via backend)
  // Save device location with precise coordinates
  saveDeviceLocation: (
    deviceId: string,
    payload: { location: string; lat: number; lng: number }
  ) =>
    apiCall(`/devices/${deviceId}/location`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ✅ Get existing location
  getDeviceLocation: (deviceId: string) =>
    apiCall(`/devices/${deviceId}/location`),

  // ✅ Rename device
  renameDevice: (deviceId: string, newName: string) =>
    apiCall(`/devices/${deviceId}/rename`, {
      method: "POST",
      body: JSON.stringify({ newName }),
    }),

  uploadAvatar: async (file: File) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/auth/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json();
  },
};


export const adminThingsboardApi = {
  createCustomer: (body: any) =>
    apiCall(
      `/admin/thingsboard/customers`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin"
    ),

  createDevice: (body: any) =>
    apiCall(
      `/admin/thingsboard/devices`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      "admin"
    ),

  assignDevice: (customerId: string, deviceId: string) =>
    apiCall(
      `/admin/thingsboard/customers/${customerId}/devices/${deviceId}`,
      { method: "POST" },
      "admin"
    ),

  unassignDevice: (deviceId: string) =>
    apiCall(
      `/admin/thingsboard/customers/devices/${deviceId}`,
      { method: "DELETE" },
      "admin"
    ),

  deleteDevice: (deviceId: string) =>
    apiCall(
      `/admin/thingsboard/devices/${deviceId}`,
      { method: "DELETE" },
      "admin"
    ),

  getAllCustomers: () => apiCall(`/admin/thingsboard/customers`, {}, "admin"),

  getAllDevices: () => apiCall(`/admin/thingsboard/devices`, {}, "admin"),

  // getDevicesForCustomer: (customerId: string) =>
  //   apiCall(`/admin/thingsboard/customers/${customerId}/devices`, {}, "admin"),

  getDevicesForCustomer: async (
    customerId: string,
    pageSize = 100,
    page = 0
  ) => {
    try {
      const url = `/admin/thingsboard/customers/${customerId}/devices?pageSize=${pageSize}&page=${page}`;
      console.log(`Fetching devices for customer ${customerId} from ${url}`);
      const response = await apiCall(url, {}, "admin");
      console.log(`Received devices:`, response);
      return response;
    } catch (error) {
      console.error(
        `Error fetching devices for customer ${customerId}:`,
        error
      );
      throw error;
    }
  },

  deleteCustomer: (customerId: string) =>
    apiCall(
      `/admin/thingsboard/customers/${customerId}`,
      { method: "DELETE" },
      "admin"
    ),

  getDeviceProfiles: () =>
    apiCall(`/admin/thingsboard/device-profiles`, {}, "admin"),
};
