import { db } from '../lib/db';

export async function cleanDatabase() {
  await db.auditLog.deleteMany();
  await db.transactionEntry.deleteMany();
  await db.transaction.deleteMany();
  await db.shopperAccount.deleteMany();
  await db.customer.deleteMany();
  await db.supplier.deleteMany();
  await db.invitation.deleteMany();
  await db.businessMember.deleteMany();
  await db.rolePermission.deleteMany();
  await db.role.deleteMany();
  await db.branch.deleteMany();
  await db.business.deleteMany();
  await db.user.deleteMany();
}
