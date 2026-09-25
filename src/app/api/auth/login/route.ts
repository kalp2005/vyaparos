import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseIdToken, sanitizeToken } from '@/lib/firebase/verify-token';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, fullName, phone, email, globalRole } = body;

    const sanitizedToken = sanitizeToken(idToken);
    if (!sanitizedToken) {
      return NextResponse.json(
        { success: false, error: 'Firebase ID token is required.' },
        { status: 400 }
      );
    }

    // 1. Verify token cryptographically with Firebase Admin
    const decoded = await verifyFirebaseIdToken(sanitizedToken);
    if (!decoded.uid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired Firebase token.' },
        { status: 401 }
      );
    }

    // 2. Find or Create User record in Supabase/Postgres
    let user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await db.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || email || null,
          phoneNumber: decoded.phone_number || phone || null,
          fullName: fullName || decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Shopkeeper'),
          globalRole: globalRole || 'SHOPKEEPER',
        },
      });

      // Log initial user registration audit
      await logAudit({
        actorUserId: user.id,
        globalRole: user.globalRole,
        action: 'USER_REGISTERED',
        entityName: 'user',
        entityId: user.id,
        newState: {
          firebaseUid: user.firebaseUid,
          fullName: user.fullName,
          globalRole: user.globalRole,
        },
      });
    }

    // 3. Find user's active business memberships
    const memberships = await db.businessMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        business: true,
        role: true,
      },
    });

    const activeBusiness = memberships.length > 0 ? memberships[0].business : null;

    // 4. Return user profile & session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        globalRole: user.globalRole,
        languagePreference: user.languagePreference,
      },
      memberships: memberships.map((m) => ({
        businessId: m.businessId,
        businessName: m.business.name,
        businessType: m.business.businessType,
        roleKey: m.role.roleKey,
      })),
      activeBusiness,
      isNewUser,
    });

    // Set secure session cookie with sanitized JWT string
    response.cookies.set('vyapar_session', sanitizedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
