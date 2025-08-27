// API service for Yeti Insight Dashboard
// Replace localhost:8080 with your actual API endpoint

const BASE_URL = "http://localhost:8080"

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface DeviceInfo {
  id: string
  name: string
  type: string
  status: string
  location: string
  customerId: string
}

export interface CustomerDashboard {
  id: string
  name: string
  description: string
  customerId: string
}

export interface TelemetryData {
  deviceId: string
  timestamp: string
  [key: string]: any // For dynamic telemetry keys
}

// Customer API calls
export const customerApi = {
  async getDashboards(customerId: string, pageSize = 10, page = 0): Promise<ApiResponse<CustomerDashboard[]>> {
    try {
      const response = await fetch(`${BASE_URL}/customers/${customerId}/dashboards?pageSize=${pageSize}&page=${page}`)
      if (!response.ok) throw new Error('Failed to fetch dashboards')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getDeviceInfos(customerId: string, pageSize = 10, page = 0): Promise<ApiResponse<DeviceInfo[]>> {
    try {
      const response = await fetch(`${BASE_URL}/customers/${customerId}/device-infos?pageSize=${pageSize}&page=${page}`)
      if (!response.ok) throw new Error('Failed to fetch device infos')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Device API calls
export const deviceApi = {
  async getDeviceInfo(deviceId: string): Promise<ApiResponse<DeviceInfo>> {
    try {
      const response = await fetch(`${BASE_URL}/devices/info/${deviceId}`)
      if (!response.ok) throw new Error('Failed to fetch device info')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: {} as DeviceInfo, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getMultipleDeviceInfos(deviceIds: string[]): Promise<ApiResponse<DeviceInfo[]>> {
    try {
      const idsParam = deviceIds.join(',')
      const response = await fetch(`${BASE_URL}/devices/by-ids?ids=${idsParam}`)
      if (!response.ok) throw new Error('Failed to fetch multiple device infos')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getCustomerDashboards(deviceId: string): Promise<ApiResponse<CustomerDashboard[]>> {
    try {
      const response = await fetch(`${BASE_URL}/devices/${deviceId}/customer-dashboards`)
      if (!response.ok) throw new Error('Failed to fetch device dashboards')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getRealtimeData(deviceId: string, keys?: string[]): Promise<ApiResponse<TelemetryData>> {
    try {
      const keysParam = keys ? `?keys=${keys.join(',')}` : ''
      const response = await fetch(`${BASE_URL}/devices/${deviceId}/realtime${keysParam}`)
      if (!response.ok) throw new Error('Failed to fetch realtime data')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: {} as TelemetryData, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getHistoricalData(deviceId: string, keys?: string[], hours = 6, limit?: number): Promise<ApiResponse<TelemetryData[]>> {
    try {
      const params = new URLSearchParams()
      if (keys) params.append('keys', keys.join(','))
      params.append('hours', hours.toString())
      if (limit) params.append('limit', limit.toString())
      
      const response = await fetch(`${BASE_URL}/devices/${deviceId}/history?${params}`)
      if (!response.ok) throw new Error('Failed to fetch historical data')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getCompleteData(deviceId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/devices/${deviceId}/complete`)
      if (!response.ok) throw new Error('Failed to fetch complete data')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: {}, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getLiveData(deviceId: string, keys?: string[], interval = 1000): Promise<ApiResponse<TelemetryData>> {
    try {
      const params = new URLSearchParams()
      if (keys) params.append('keys', keys.join(','))
      params.append('interval', interval.toString())
      
      const response = await fetch(`${BASE_URL}/devices/${deviceId}/live?${params}`)
      if (!response.ok) throw new Error('Failed to fetch live data')
      const data = await response.json()
      return { data }
    } catch (error) {
      return { data: {} as TelemetryData, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Utility function to check if API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}