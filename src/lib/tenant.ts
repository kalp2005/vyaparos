import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, AuthContext } from './auth';
import { hasPermission, PermissionKey } from './types/permissions';

export interface TenantContext {
  user: AuthContext['user'];
  membership: NonNullable<AuthContext['membership']>;
  business: NonNullable<AuthContext['business']>;
}

/**
 * Validates that the user is authenticated, belongs to the business tenant,
 * and possesses the required permission.
 */
export async function requireTenant(
  req: NextRequest,
  requiredPermission?: PermissionKey,
  targetBusinessId?: string
): Promise<{ context: TenantContext } | { errorResponse: NextResponse }> {
  const authCtx = await getAuthContext(req, targetBusinessId);

  if (!authCtx || !authCtx.user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
    };
  }

  if (!authCtx.membership || !authCtx.business) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'No active business membership found. Please create or join a business.',
        },
        { status: 403 }
      ),
    };
  }

  // If a specific permission is required, verify against the role
  if (requiredPermission) {
    const isOwner = authCtx.membership.roleKey === 'OWNER';
    const isAllowed = isOwner || hasPermission(authCtx.membership.roleKey, requiredPermission);

    if (!isAllowed) {
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Access Denied. Role '${authCtx.membership.roleKey}' lacks required permission '${requiredPermission}'.`,
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    context: {
      user: authCtx.user,
      membership: authCtx.membership,
      business: authCtx.business,
    },
  };
}
