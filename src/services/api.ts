const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const authApi = {
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request('/auth/me'),
};

export const purchaseApi = {
  generatePlan: () => request('/purchase/plan/generate'),

  getOrders: (status?: string) =>
    request(`/purchase/orders${status ? `?status=${status}` : ''}`),

  getOrder: (id: string) => request(`/purchase/orders/${id}`),

  createOrder: (data: {
    supplierId: string;
    supplierName: string;
    items: any[];
    createdBy?: string;
  }) =>
    request('/purchase/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveOrder: (
    id: string,
    data: {
      level: number;
      approvedBy: string;
      opinion: string;
      approved: boolean;
    }
  ) =>
    request(`/purchase/orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendOrder: (id: string) =>
    request(`/purchase/orders/${id}/send`, {
      method: 'POST',
    }),

  receiveOrder: (id: string, receivedBy?: string) =>
    request(`/purchase/orders/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({ receivedBy }),
    }),
};

export const monitorApi = {
  getZones: () => request('/monitor/zones'),

  updateZoneData: (id: string, temperature: number, humidity: number) =>
    request(`/monitor/zones/${id}/data`, {
      method: 'PUT',
      body: JSON.stringify({ temperature, humidity }),
    }),

  getRecords: (params?: { zoneId?: string; limit?: number; isAlert?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.zoneId) query.append('zoneId', params.zoneId);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.isAlert !== undefined) query.append('isAlert', params.isAlert.toString());
    return request(`/monitor/records${query.toString() ? `?${query.toString()}` : ''}`);
  },

  getAlerts: (params?: { handled?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.handled !== undefined) query.append('handled', params.handled.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request(`/monitor/alerts${query.toString() ? `?${query.toString()}` : ''}`);
  },

  createAlert: (data: {
    zoneId: string;
    zoneName: string;
    alertType: string;
    message: string;
  }) =>
    request('/monitor/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  handleAlert: (id: string, handledBy?: string) =>
    request(`/monitor/alerts/${id}/handle`, {
      method: 'POST',
      body: JSON.stringify({ handledBy }),
    }),

  handleRecord: (id: string, handledBy?: string) =>
    request(`/monitor/records/${id}/handle`, {
      method: 'POST',
      body: JSON.stringify({ handledBy }),
    }),
};

export const prescriptionApi = {
  getAll: (status?: string) =>
    request(`/prescriptions${status ? `?status=${status}` : ''}`),

  get: (id: string) => request(`/prescriptions/${id}`),

  validate: (id: string) =>
    request(`/prescriptions/${id}/validate`, {
      method: 'POST',
    }),

  validateItems: (data: {
    items: any[];
    patientAge: number;
    patientWeight?: number;
  }) =>
    request('/prescriptions/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  review: (
    id: string,
    data: {
      reviewedBy: string;
      status: string;
      opinion: string;
    }
  ) =>
    request(`/prescriptions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  create: (data: {
    patientName: string;
    patientAge: number;
    patientWeight?: number;
    patientGender?: string;
    department: string;
    doctor: string;
    items: any[];
  }) =>
    request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDrugConflicts: () => request('/prescriptions/drugs/conflicts'),

  getPediatricDosages: () => request('/prescriptions/drugs/pediatric-dosages'),
};

export const statisticsApi = {
  getOverview: (period?: string) =>
    request(`/statistics/overview${period ? `?period=${period}` : ''}`),

  getMonthlyPurchase: (year?: number) =>
    request(`/statistics/purchase/monthly${year ? `?year=${year}` : ''}`),

  getPurchaseByCategory: (period?: string) =>
    request(`/statistics/purchase/by-category${period ? `?period=${period}` : ''}`),

  getPurchaseBySupplier: (params?: { period?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request(`/statistics/purchase/by-supplier${query.toString() ? `?${query.toString()}` : ''}`);
  },

  getInventoryTurnover: (params?: { category?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request(`/statistics/inventory/turnover${query.toString() ? `?${query.toString()}` : ''}`);
  },

  getInventoryExpiry: () => request('/statistics/inventory/expiry'),

  getCategories: () => request('/statistics/categories'),

  getExportPurchase: (period?: string) =>
    request(`/statistics/export/purchase${period ? `?period=${period}` : ''}`),

  getExportSuppliers: (period?: string) =>
    request(`/statistics/export/suppliers${period ? `?period=${period}` : ''}`),

  getExportInventory: (limit?: number) =>
    request(`/statistics/export/inventory${limit ? `?limit=${limit}` : ''}`),
};

export default {
  auth: authApi,
  purchase: purchaseApi,
  monitor: monitorApi,
  prescription: prescriptionApi,
  statistics: statisticsApi,
};
