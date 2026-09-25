import Dexie, { Table } from 'dexie';

export interface LocalCustomer {
  id: string;
  businessId: string;
  name: string;
  phoneNumber: string;
  outstandingBalance: number;
  paymentReliabilityScore: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  updatedAt: number;
}

export interface LocalTransaction {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  transactionType: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';
  amount: number;
  paymentMode: string;
  transactionDate: string;
  description?: string;
  isVoided: boolean;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
}

export interface OutboxSyncItem {
  id: string; // Client-generated UUID Idempotency Key
  businessId: string;
  actionType: 'CREATE_CUSTOMER' | 'ADD_TRANSACTION' | 'REVERSE_TRANSACTION';
  payload: any;
  createdAt: number;
  retryCount: number;
  status: 'QUEUED' | 'SYNCING' | 'FAILED';
  lastError?: string;
}

export class VyaparDexieDB extends Dexie {
  customers!: Table<LocalCustomer, string>;
  transactions!: Table<LocalTransaction, string>;
  outbox!: Table<OutboxSyncItem, string>;

  constructor() {
    super('VyaparOS_ClientStore');
    this.version(1).stores({
      customers: 'id, businessId, phoneNumber, syncStatus, updatedAt',
      transactions: 'id, businessId, customerId, transactionType, syncStatus',
      outbox: 'id, businessId, actionType, status, createdAt',
    });
  }
}

// Client-side singleton for browser environments
export const localDb = typeof window !== 'undefined' ? new VyaparDexieDB() : null;
