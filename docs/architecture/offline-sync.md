# VyaparOS — Offline-First Architecture & Synchronization Protocol

**Document Version:** 1.0.0  
**Target Performance:** 100% Offline Counter Usability, Zero Data Loss

---

## 1. The Offline-First Mandate

Small merchants in Indian retail markets frequently experience flaky 4G/5G mobile signals, power cuts, and basement connectivity drops. 

**VyaparOS Core Rule:** **No merchant should ever be blocked from billing a customer, recording an udhar entry, or checking stock because the internet is down.**

```mermaid
stateDiagram-v2
    [*] --> Online
    Online --> Offline : Connection Lost
    Offline --> Syncing : Connection Restored
    Syncing --> Online : All Outbox Items Processed
    Syncing --> SyncError : Conflict / Validation Failure
    SyncError --> Syncing : Retry Action / Manual Resolution
    Online --> Syncing : New Action Created (Optimistic)
```

---

## 2. Client-Side Data Store (IndexedDB via Dexie.js)

The client PWA maintains a fast local replica of the active business dataset:

```typescript
// Dexie.js Client-Side Schema Definition
import Dexie, { Table } from 'dexie';

export interface LocalCustomer {
  id: string;
  businessId: string;
  name: string;
  phoneNumber: string;
  outstandingBalance: number;
  paymentReliabilityScore: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
}

export interface LocalProduct {
  id: string;
  businessId: string;
  name: string;
  barcode: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
  gstRate: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
}

export interface OutboxSyncItem {
  id: string; // UUID (Client-generated idempotency key)
  businessId: string;
  actionType: 'CREATE_INVOICE' | 'ADD_KHATA_ENTRY' | 'CREATE_CUSTOMER' | 'UPDATE_STOCK';
  payload: any;
  createdAt: number; // Client epoch timestamp
  retryCount: number;
  lastError?: string;
}

export class VyaparLocalDatabase extends Dexie {
  customers!: Table<LocalCustomer, string>;
  products!: Table<LocalProduct, string>;
  outbox!: Table<OutboxSyncItem, string>;

  constructor() {
    super('VyaparOS_LocalDB');
    this.version(1).stores({
      customers: 'id, businessId, phoneNumber, syncStatus',
      products: 'id, businessId, barcode, sku, syncStatus',
      outbox: 'id, businessId, actionType, createdAt'
    });
  }
}
```

---

## 3. Optimistic UI & Local Outbox Flow

When a merchant completes a sale or logs an udhar entry offline:

```mermaid
sequenceDiagram
    actor Cashier as Counter Cashier
    participant UI as POS Counter View
    participant LocalDB as Client IndexedDB
    participant Outbox as Outbox Queue
    participant SyncWorker as Background Sync Worker
    participant Server as VyaparOS API Server

    Cashier->>UI: Submit ₹1,200 Bill (Cashier Offline)
    UI->>LocalDB: Update Local Product Stock & Customer Balance (Optimistic)
    UI->>Outbox: Push CREATE_INVOICE event (UUID Idempotency Key)
    UI-->>Cashier: Instant "Bill Created ✓" & Thermal Print (150ms)
    
    note over SyncWorker: Device reconnects to network
    SyncWorker->>Outbox: Dequeue Oldest Pending Event
    SyncWorker->>Server: POST /api/v1/sync/outbox (with Idempotency Key)
    
    Server->>Server: Validate & Apply Transaction Atomically
    Server-->>SyncWorker: 200 OK (Server Version & State Diff)
    SyncWorker->>Outbox: Remove Completed Event
    SyncWorker->>UI: Update Connection State to "Online 🟢"
```

---

## 4. Conflict Resolution Strategy

### Conflict Matrix & Resolution Rules

| Operation Type | Potential Conflict Scenario | VyaparOS Resolution Rule |
| :--- | :--- | :--- |
| **New Invoice Creation** | Created offline simultaneously with another device. | **Idempotent Insertion (No Conflict).** Client generates UUID. Invoices are append-only. |
| **Khata Payment / Udhar** | Two devices record payments for same customer offline. | **Delta-Based Aggregation.** Server adds/subtracts delta values rather than overwriting absolute balance. |
| **Stock Deduction** | Two offline devices sell the last 5 units of an item. | **Server-Authoritative Stock Audit.** Both sales succeed locally. Server logs negative stock adjustment alert with notification to owner: *"Stock deficit of 5 units on Parle-G"*. |
| **Customer Phone Edit** | Two devices edit customer address/phone offline. | **Last-Write-Wins (LWW) with Server Timestamp.** |

---

## 5. Sync Error Handling & Telemetry

1. **Exponential Backoff:** Retries failed sync requests at `2s`, `5s`, `15s`, `30s`, up to max 1 minute intervals.
2. **Permanent Schema Rejection:** If a sync item fails due to validation errors (e.g. invalid GSTIN format), the item is flagged with status `ERROR`, preserved in the local database, and displayed in the **Sync Center Drawer** with a manual "Fix & Retry" prompt.
3. **Bandwidth Optimization:** Payloads are compressed with gzip/brotli. Sync requests batch up to 50 queued outbox actions per HTTP roundtrip.
