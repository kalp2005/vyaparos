import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { verifyFirebaseIdToken, sanitizeToken } from '../lib/firebase/verify-token';
import { cleanDatabase } from './setup';

describe('VyaparOS — Firebase Auth & User Profile Identity Bridge', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('correctly sanitizes and extracts raw JWT from Bearer header strings', () => {
    const rawBearer = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxMjMifQ.abc';
    const clean = sanitizeToken(rawBearer);
    expect(clean).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxMjMifQ.abc');

    const quotedToken = '"Bearer dev-token-sample_user"';
    const cleanQuoted = sanitizeToken(quotedToken);
    expect(cleanQuoted).toBe('dev-token-sample_user');
  });

  it('correctly verifies a simulated/development Firebase ID token even if prefixed with Bearer', async () => {
    const token = 'Bearer dev-token-merchant_uid_123';
    const decoded = await verifyFirebaseIdToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.uid).toBe('merchant_uid_123');
    expect(decoded.email).toBe('merchant_uid_123@example.com');
  });

  it('rejects an empty or malformed authorization token', async () => {
    await expect(verifyFirebaseIdToken('')).rejects.toThrow('Missing or malformed authorization token.');
    await expect(verifyFirebaseIdToken('   ')).rejects.toThrow('Missing or malformed authorization token.');
  });

  it('creates a Supabase user profile linked to verified Firebase UID', async () => {
    const decodedUid = 'fb_user_random_456';
    
    // Simulate user creation
    const user = await db.user.create({
      data: {
        firebaseUid: decodedUid,
        email: 'kirana.owner@example.com',
        phoneNumber: '+919876543210',
        fullName: 'Ramesh Kumar',
        globalRole: 'SHOPKEEPER',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.firebaseUid).toBe(decodedUid);
    expect(user.globalRole).toBe('SHOPKEEPER');

    // Retrieve via Firebase UID
    const foundUser = await db.user.findUnique({
      where: { firebaseUid: decodedUid },
    });

    expect(foundUser?.id).toBe(user.id);
    expect(foundUser?.fullName).toBe('Ramesh Kumar');
  });

  it('enforces UNIQUE constraint on firebase_uid', async () => {
    const duplicateUid = 'duplicate_fb_uid_789';

    await db.user.create({
      data: {
        firebaseUid: duplicateUid,
        fullName: 'First Owner',
        globalRole: 'SHOPKEEPER',
      },
    });

    await expect(
      db.user.create({
        data: {
          firebaseUid: duplicateUid,
          fullName: 'Second Owner',
          globalRole: 'SHOPKEEPER',
        },
      })
    ).rejects.toThrow();
  });
});
