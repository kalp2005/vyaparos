import { User as FirebaseUser } from 'firebase/auth';
import { GlobalRole, BusinessRole, PermissionKey } from '../types/permissions';

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  phoneNumber: string | null;
  email: string | null;
  fullName: string;
  globalRole: GlobalRole;
  avatarUrl?: string | null;
  languagePreference: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BusinessMembershipSummary {
  id: string;
  businessId: string;
  businessName: string;
  businessType: string;
  branchId: string | null;
  roleKey: BusinessRole;
  status: string;
}

export interface AuthContextState {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  firebaseUid: string | null;
  globalRole: GlobalRole | null;
  memberships: BusinessMembershipSummary[];
  activeBusiness: {
    id: string;
    name: string;
    businessType: string;
    currency: string;
  } | null;
  activeRole: BusinessRole | null;
  permissions: PermissionKey[];
  isLoading: boolean;
  isAuthenticated: boolean;
}
