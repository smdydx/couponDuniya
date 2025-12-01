import api from './client';

// Types
export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: number;
  code: string;
  description?: string;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface RoleCreate {
  name: string;
  slug: string;
  description?: string;
}

export interface PermissionCreate {
  code: string;
  description?: string;
}

export interface DepartmentCreate {
  name: string;
  slug: string;
  description?: string;
}

export interface AssignPermission {
  role_id: number;
  permission_id: number;
}

export interface AssignRole {
  user_id: number;
  role_id: number;
}

export interface AssignDepartment {
  user_id: number;
  department_id: number;
}

// API Functions

// Roles
export async function fetchRoles(): Promise<Role[]> {
  const response = await api.get('/access/roles');
  return response.data;
}

export async function createRole(data: RoleCreate): Promise<Role> {
  const response = await api.post('/access/roles', data);
  return response.data;
}

// Permissions
export async function fetchPermissions(): Promise<Permission[]> {
  const response = await api.get('/access/permissions');
  return response.data;
}

export async function createPermission(data: PermissionCreate): Promise<Permission> {
  const response = await api.post('/access/permissions', data);
  return response.data;
}

// Departments
export async function fetchDepartments(): Promise<Department[]> {
  const response = await api.get('/access/departments');
  return response.data;
}

export async function createDepartment(data: DepartmentCreate): Promise<Department> {
  const response = await api.post('/access/departments', data);
  return response.data;
}

// Assignments
export async function assignPermissionToRole(data: AssignPermission): Promise<{ status: string }> {
  const response = await api.post('/access/roles/assign-permission', data);
  return response.data;
}

export async function assignRoleToUser(data: AssignRole): Promise<{ status: string }> {
  const response = await api.post('/access/assign-role', data);
  return response.data;
}

export async function assignDepartmentToUser(data: AssignDepartment): Promise<{ status: string }> {
  const response = await api.post('/access/assign-department', data);
  return response.data;
}
