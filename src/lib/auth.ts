import { NextRequest } from 'next/server';
import { db } from './db';
import { verifyFirebaseIdToken, sanitizeToken } from './firebase/verify-token';
import { GlobalRole, BusinessRole } from './types/permissions';

export interface AuthContext {
  user: {
    id: string;
    firebaseUid: string;
    email: string | null;
    phoneNumber: string | null;
    fullName: string;
    globalRole: GlobalRole;
    languagePreference: string;
  };
  membership?: {
    id: string;
    businessId: string;
    branchId: string | null;
    roleKey: BusinessRole;
    status: string;
  };
  business?: {
    id: string;
    name: string;
    businessType: string;
    currency: string;
  };
}

/**
 * Extract and sanitize auth token from Request headers or cookies
 */
export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const sanitized = sanitizeToken(authHeader);
    if (sanitized) return sanitized;
  }
  const cookie = req.cookies.get('vyapar_session');
  if (cookie?.value) {
    return sanitizeToken(cookie.value);
  }
  return null;
}

/**
 * Authenticate incoming request and resolve User + Business Membership
 */
export async function getAuthContext(
  req: NextRequest,
  requiredBusinessId?: string
): Promise<AuthContext | null> {
  const token = extractToken(req);
  if (!token) return null;

  try {
    const decoded = await verifyFirebaseIdToken(token);
    if (!decoded || !decoded.uid) return null;

    // Lookup user in database
    let user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    // Auto-provision user record if first-time Firebase login
    if (!user) {
      user = await db.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || null,
          phoneNumber: decoded.phone_number || null,
          fullName: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Shopkeeper'),
          globalRole: 'SHOPKEEPER',
        },
      });
    }

    const authCtx: AuthContext = {
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        globalRole: user.globalRole as GlobalRole,
        languagePreference: user.languagePreference,
      },
    };

    // If a specific business context is requested or business header provided
    const targetBusinessId =
      requiredBusinessId ||
      req.headers.get('x-business-id') ||
      req.nextUrl.searchParams.get('businessId');

    if (targetBusinessId) {
      const membership = await db.businessMember.findFirst({
        where: {
          userId: user.id,
          businessId: targetBusinessId,
          status: 'ACTIVE',
        },
        include: {
          business: true,
          role: true,
        },
      });

      if (membership) {
        authCtx.membership = {
          id: membership.id,
          businessId: membership.businessId,
          branchId: membership.branchId,
          roleKey: membership.role.roleKey as BusinessRole,
          status: membership.status,
        };
        authCtx.business = {
          id: membership.business.id,
          name: membership.business.name,
          businessType: membership.business.businessType,
          currency: membership.business.currency,
        };
      }
    } else {
      // Find user's default/first active business membership
      const defaultMembership = await db.businessMember.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
        include: {
          business: true,
          role: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (defaultMembership) {
        authCtx.membership = {
          id: defaultMembership.id,
          businessId: defaultMembership.businessId,
          branchId: defaultMembership.branchId,
          roleKey: defaultMembership.role.roleKey as BusinessRole,
          status: defaultMembership.status,
        };
        authCtx.business = {
          id: defaultMembership.business.id,
          name: defaultMembership.business.name,
          businessType: defaultMembership.business.businessType,
          currency: defaultMembership.business.currency,
        };
      }
    }

    return authCtx;
  } catch (err) {
    console.error('Authentication verification error:', err);
    return null;
  }
}
