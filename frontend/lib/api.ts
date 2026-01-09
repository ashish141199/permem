/**
 * API Client for Permem Backend
 * Handles all communication with the backend server
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// ============ Types ============

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  apiKey: string;
  maxMemories: number;
}

export interface Memory {
  id: string;
  userId: string;
  summary: string;
  type: string;
  importance: string;
  importanceScore: number;
  createdAt: string;
  topics?: string[];
}

export interface AuthResponse {
  user: User;
  project: Project;
  token: string;
}

export interface ProjectStats {
  memoryCount: number;
  maxMemories: number;
}

// ============ Token Management ============

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('permem_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('permem_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('permem_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============ HTTP Helpers ============

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ Auth API ============

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await request<AuthResponse>('POST', '/auth/signup', {
    name,
    email,
    password,
  });
  setToken(response.token);
  return response;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await request<AuthResponse>('POST', '/auth/login', {
    email,
    password,
  });
  setToken(response.token);
  return response;
}

export async function getMe(): Promise<{ user: User; project: Project | null }> {
  return request('GET', '/auth/me');
}

export function logout(): void {
  clearToken();
}

// ============ Projects API ============

export async function getProjects(): Promise<{ projects: Project[] }> {
  return request('GET', '/projects');
}

export async function updateProject(
  projectId: string,
  data: { name?: string }
): Promise<{ project: Project }> {
  return request('PATCH', `/projects/${projectId}`, data);
}

export async function getProjectStats(projectId: string): Promise<ProjectStats> {
  return request('GET', `/projects/${projectId}/stats`);
}

export async function getProjectMemories(
  projectId: string,
  limit: number = 50
): Promise<{ memories: Memory[] }> {
  return request('GET', `/projects/${projectId}/memories?limit=${limit}`);
}

export async function regenerateApiKey(
  projectId: string
): Promise<{ apiKey: string }> {
  return request('POST', `/projects/${projectId}/regenerate-key`);
}

// ============ Graph API ============

export interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    importance: number;
    userId: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
  }>;
}

export async function getGraph(
  projectId: string,
  userId?: string
): Promise<GraphData> {
  const params = new URLSearchParams({ projectId });
  if (userId) params.set('userId', userId);
  return request('GET', `/v1/graph?${params.toString()}`);
}
