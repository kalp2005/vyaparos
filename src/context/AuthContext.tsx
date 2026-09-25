'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';
import {
  loginWithEmail as fbLoginWithEmail,
  registerWithEmail as fbRegisterWithEmail,
  logoutFirebaseUser,
} from '@/lib/firebase/auth';
import { AuthContextState, UserProfile, BusinessMembershipSummary } from '@/lib/firebase/types';
import { GlobalRole, BusinessRole, PermissionKey, ROLE_PERMISSIONS } from '@/lib/types/permissions';
import { apiFetch } from '@/lib/api-client';

interface AuthContextValue extends AuthContextState {
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, fullName: string, role?: GlobalRole) => Promise<void>;
  loginWithDevToken: (uid: string, fullName: string, role?: GlobalRole) => Promise<void>;
  signOut: () => Promise<void>;
  switchBusiness: (businessId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [memberships, setMemberships] = useState<BusinessMembershipSummary[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<AuthContextState['activeBusiness']>(null);
  const [activeRole, setActiveRole] = useState<BusinessRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync session with backend API
  const syncBackendSession = async (
    idToken: string,
    fallbackInfo?: { fullName?: string; email?: string; phone?: string; role?: GlobalRole }
  ) => {
    try {
      const cleanToken = idToken.trim();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`,
        },
        body: JSON.stringify({
          idToken: cleanToken,
          fullName: fallbackInfo?.fullName,
          email: fallbackInfo?.email,
          phone: fallbackInfo?.phone,
          globalRole: fallbackInfo?.role || 'SHOPKEEPER',
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setMemberships(data.memberships || []);
        if (data.activeBusiness) {
          setActiveBusiness(data.activeBusiness);
          const activeMem = data.memberships?.find((m: any) => m.businessId === data.activeBusiness.id);
          setActiveRole(activeMem?.roleKey || (data.user.globalRole === 'ADMIN' ? 'OWNER' : null));
        }
      }
    } catch (err) {
      console.error('Session sync error:', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setMemberships(data.accessibleBusinesses || []);
        setActiveBusiness(data.activeBusiness || null);
        setActiveRole(data.membership?.roleKey || null);
      }
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          await syncBackendSession(token, {
            email: fbUser.email || undefined,
            phone: fbUser.phoneNumber || undefined,
            fullName: fbUser.displayName || undefined,
          });
        } catch (tokenErr) {
          console.error('Error fetching initial Firebase ID token:', tokenErr);
        }
      } else {
        await refreshProfile();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const fbUser = await fbLoginWithEmail(email, pass);
      const token = await fbUser.getIdToken();
      await syncBackendSession(token, { email: fbUser.email || email });
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string, role: GlobalRole = 'SHOPKEEPER') => {
    setIsLoading(true);
    try {
      const fbUser = await fbRegisterWithEmail(email, pass, fullName);
      const token = await fbUser.getIdToken();
      await syncBackendSession(token, { email: fbUser.email || email, fullName, role });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDevToken = async (uid: string, fullName: string, role: GlobalRole = 'SHOPKEEPER') => {
    setIsLoading(true);
    try {
      const idToken = `dev-token-${uid}`;
      await syncBackendSession(idToken, { fullName, role, email: `${uid}@vyaparos.test` });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await logoutFirebaseUser();
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setFirebaseUser(null);
      setMemberships([]);
      setActiveBusiness(null);
      setActiveRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchBusiness = async (businessId: string) => {
    const target = memberships.find((m) => m.businessId === businessId);
    if (target) {
      setActiveBusiness({
        id: target.businessId,
        name: target.businessName,
        businessType: target.businessType,
        currency: 'INR',
      });
      setActiveRole(target.roleKey);
    }
  };

  const permissions: PermissionKey[] = activeRole ? ROLE_PERMISSIONS[activeRole] || [] : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        firebaseUid: user?.firebaseUid || firebaseUser?.uid || null,
        globalRole: user?.globalRole || null,
        memberships,
        activeBusiness,
        activeRole,
        permissions,
        isLoading,
        isAuthenticated: !!user,
        signInWithEmail,
        signUpWithEmail,
        loginWithDevToken,
        signOut,
        switchBusiness,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
