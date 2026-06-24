export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users', 'PreventiveMaintenance'],
  admin: ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users', 'PreventiveMaintenance'],
  manager: ['Dashboard', 'Approve', 'Reports', 'PreventiveMaintenance'],
  supervisor: ['Dashboard', 'Create', 'Edit', 'Approve', 'Reports', 'PreventiveMaintenance'],
  technician: ['Dashboard', 'Create', 'PreventiveMaintenance'],
  viewer: ['Dashboard', 'PreventiveMaintenance']
};

export const hasPermission = (level: string, permission: string): boolean => {
  const normalizedLevel = String(level || '').trim().toLowerCase();
  const allowed = ROLE_PERMISSIONS[normalizedLevel];
  if (!allowed) return false;
  return allowed.includes(permission);
};
