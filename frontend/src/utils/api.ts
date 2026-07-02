const API_BASE = process.env.REACT_APP_API_URL || '/api';

const getToken = (): string | null => localStorage.getItem('token');

const headers = (isFormData = false): Record<string, string> => {
  const h: Record<string, string> = { Authorization: `Bearer ${getToken()}` };
  if (!isFormData) h['Content-Type'] = 'application/json';
  return h;
};

const handleResponse = async (res: Response): Promise<any> => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'resident';
}

interface AuthResponse {
  token: string;
  user: User;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  photoPath?: string;
  isOverdue?: boolean;
  resident?: { id: string; name: string; flatNumber?: string; email?: string };
  history?: Array<{ id: string; action: string; fromStatus?: string; toStatus?: string; fromPriority?: string; toPriority?: string; note?: string; createdAt: string; actor?: { id: string; name: string; role: string } }>;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isImportant?: boolean;
  createdAt: string;
  admin?: { name: string };
}

interface DashboardStats {
  total: number;
  overdueCount: number;
  byStatus: Array<{ status: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
}

interface ComplaintsPage {
  total: number;
  page: number;
  pages: number;
  complaints: Complaint[];
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string; role: string }): Promise<AuthResponse> =>
    fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  login: (body: { email: string; password: string }): Promise<AuthResponse> =>
    fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  getProfile: (): Promise<User> =>
    fetch(`${API_BASE}/auth/profile`, { headers: headers() }).then(handleResponse).then((data) => data.user),

  // Complaints
  createComplaint: (formData: FormData): Promise<Complaint> =>
    fetch(`${API_BASE}/complaints`, { method: 'POST', headers: headers(true), body: formData }).then(handleResponse),
  getMyComplaints: (): Promise<Complaint[]> =>
    fetch(`${API_BASE}/complaints/my`, { headers: headers() }).then(handleResponse),
  getAllComplaints: (params = ''): Promise<ComplaintsPage> =>
    fetch(`${API_BASE}/complaints?${params}`, { headers: headers() }).then(handleResponse),
  getDashboard: (): Promise<DashboardStats> =>
    fetch(`${API_BASE}/complaints/dashboard`, { headers: headers() }).then(handleResponse),
  updateStatus: (id: string, body: { status: string }): Promise<Complaint> =>
    fetch(`${API_BASE}/complaints/${id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handleResponse),
  updatePriority: (id: string, body: { priority: string }): Promise<Complaint> =>
    fetch(`${API_BASE}/complaints/${id}/priority`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handleResponse),
  flagOverdue: (): Promise<{ message: string }> =>
    fetch(`${API_BASE}/complaints/flag-overdue`, { method: 'POST', headers: headers() }).then(handleResponse),

  // Notices
  getNotices: (): Promise<Notice[]> =>
    fetch(`${API_BASE}/notices`, { headers: headers() }).then(handleResponse),
  createNotice: (body: { title: string; content: string; isImportant?: boolean }): Promise<Notice> =>
    fetch(`${API_BASE}/notices`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse),
  deleteNotice: (id: string): Promise<{ message: string }> =>
    fetch(`${API_BASE}/notices/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
};
