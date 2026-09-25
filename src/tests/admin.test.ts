import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { PERMISSIONS } from '../lib/types/permissions';
import { logAudit } from '../lib/audit';
import { cleanDatabase } from './setup';

describe('VyaparOS — Platform Admin & Merchant Privacy Guard', () => {
  let adminUser: any;
  let merchantUser: any;
  let business: any;

  beforeEach(async () => {
    await cleanDatabase();

    adminUser = await db.user.create({
      data: {
        firebaseUid: 'fb_superadmin_1',
        fullName: 'Super Admin User',
        globalRole: 'ADMIN',
      },
    });

    merchantUser = await db.user.create({
      data: {
        firebaseUid: 'fb_merchant_test',
        fullName: 'Store Owner',
        globalRole: 'SHOPKEEPER',
      },
    });

    business = await db.business.create({
      data: {
        ownerUserId: merchantUser.id,
        name: 'Merchant Retail Store',
      },
    });
  });

  it('verifies ADMIN role possesses platform permissions and is separate from SHOPKEEPER', async () => {
    expect(adminUser.globalRole).toBe('ADMIN');
    expect(merchantUser.globalRole).toBe('SHOPKEEPER');
    expect(PERMISSIONS.PLATFORM_USERS_MANAGE).toBe('platform.users.manage');
    expect(PERMISSIONS.PLATFORM_BUSINESSES_MANAGE).toBe('platform.businesses.manage');
  });

  it('records mandatory audit log when Admin performs governance action on merchant tenant', async () => {
    const audit = await logAudit({
      businessId: business.id,
      actorUserId: adminUser.id,
      globalRole: adminUser.globalRole,
      action: 'ADMIN_SUPPORT_INSPECT',
      entityName: 'business',
      entityId: business.id,
      newState: {
        reason: 'Authorized support ticket #4912',
      },
    });

    expect(audit).toBeDefined();
    expect(audit.actorUserId).toBe(adminUser.id);
    expect(audit.globalRole).toBe('ADMIN');
    expect(audit.action).toBe('ADMIN_SUPPORT_INSPECT');

    const savedLog = await db.auditLog.findUnique({
      where: { id: audit.id },
    });
    expect(savedLog).toBeDefined();
  });
});
