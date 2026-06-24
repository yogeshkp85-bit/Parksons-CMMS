export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users'],
  admin: ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users'],
  manager: ['Dashboard', 'Approve', 'Reports'],
  supervisor: ['Dashboard', 'Create', 'Edit', 'Approve', 'Reports'],
  technician: ['Dashboard', 'Create'],
  viewer: ['Dashboard']
};

export const hasPermission = (role: string, permission: string): boolean => {
  const normalizedRole = String(role || '').trim().toLowerCase();
  const allowed = ROLE_PERMISSIONS[normalizedRole];
  if (!allowed) return false;
  return allowed.includes(permission);
};
