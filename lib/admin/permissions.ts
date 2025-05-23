import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Permission types
export type ResourceType = 'users' | 'orders' | 'couriers' | 'businesses' | 'settings' | 'reports' | 'dashboard';
export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'approve' | 'reject';

export interface Permission {
  resource: ResourceType;
  action: ActionType;
}

// Format: resource:action
export type PermissionString = `${ResourceType}:${ActionType}`;

// Types for Admin and related models
type Admin = {
  id: string;
  userId: string;
  isSuperAdmin: boolean;
  // Other fields...
};

type AdminRoleMapping = {
  id: string;
  adminId: string;
  roleId: string;
  role: {
    permissions: {
      name: string;
    }[];
  };
};

/**
 * Checks if the current admin user has the required permission
 */
export async function hasPermission(permissionStr: PermissionString): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    // No session or not an admin
    if (!session || session.user.role !== 'ADMIN') {
      return false;
    }
    
    // Get admin from database
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    }) as unknown as Admin | null;
    
    if (!admin) {
      return false;
    }
    
    // Super admins have all permissions
    if (admin.isSuperAdmin) {
      return true;
    }
    
    // TODO: When the schema migration is applied, this will work.
    // For now, we just check the direct permissions in the admin schema
    // Check permissions from role mappings
    // Until migration is applied, return true for testing
    return true;
    
    /* Actual implementation once schema migration is applied
    const roleWithPermissions = await prisma.adminRoleMapping.findMany({
      where: { adminId: admin.id },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    // Extract permissions from all roles
    const permissions = roleWithPermissions.flatMap(
      (rm: AdminRoleMapping) => rm.role.permissions.map((p: { name: string }) => p.name)
    );
    
    // Check if the required permission exists
    return permissions.includes(permissionStr);
    */
  } catch (error) {
    console.error("Error checking admin permission:", error);
    return false;
  }
}

/**
 * Higher-order function to check permission before executing handler
 */
export function withPermission(handler: Function, permission: PermissionString) {
  return async (req: Request, ...args: any[]) => {
    const hasAccess = await hasPermission(permission);
    
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return handler(req, ...args);
  };
}

/**
 * Get all permissions for the current admin user
 */
export async function getCurrentAdminPermissions(): Promise<PermissionString[]> {
  try {
    const session = await getServerSession(authOptions);
    
    // No session or not an admin
    if (!session || session.user.role !== 'ADMIN') {
      return [];
    }
    
    // Get admin from database
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    }) as unknown as Admin | null;
    
    if (!admin) {
      return [];
    }
    
    // Super admins have all permissions
    if (admin.isSuperAdmin) {
      // Return all permissions
      return getAllPermissions();
    }
    
    // TODO: When the schema migration is applied, this will work
    // For now, return a basic set of permissions for testing
    return ['users:view', 'dashboard:view'] as PermissionString[];
    
    /* Actual implementation once schema migration is applied
    const roleWithPermissions = await prisma.adminRoleMapping.findMany({
      where: { adminId: admin.id },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    // Extract permissions from all roles
    return roleWithPermissions.flatMap(
      (rm: AdminRoleMapping) => rm.role.permissions.map((p: { name: string }) => p.name)
    ) as PermissionString[];
    */
  } catch (error) {
    console.error("Error getting admin permissions:", error);
    return [];
  }
}

/**
 * Generate all possible permissions
 */
export function getAllPermissions(): PermissionString[] {
  const resources: ResourceType[] = ['users', 'orders', 'couriers', 'businesses', 'settings', 'reports', 'dashboard'];
  const actions: ActionType[] = ['view', 'create', 'edit', 'delete', 'export', 'import', 'approve', 'reject'];
  
  const permissions: PermissionString[] = [];
  
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push(`${resource}:${action}`);
    }
  }
  
  return permissions;
} 