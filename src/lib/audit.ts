import { db } from './db';

export interface AuditParams {
  businessId?: string;
  actorUserId: string;
  globalRole: string;
  businessRole?: string;
  action: string;
  entityName: string;
  entityId: string;
  oldState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record an immutable financial or administrative audit log entry
 */
export async function logAudit(params: AuditParams, tx?: any) {
  const client = tx || db;
  try {
    return await client.auditLog.create({
      data: {
        businessId: params.businessId || null,
        actorUserId: params.actorUserId,
        globalRole: params.globalRole,
        businessRole: params.businessRole || null,
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId,
        oldState: params.oldState ? JSON.stringify(params.oldState) : null,
        newState: params.newState ? JSON.stringify(params.newState) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // In production financial systems, audit failures can be critical
    throw err;
  }
}
