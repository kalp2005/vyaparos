# VyaparOS — Product Research & Market Domain Intelligence

**Document Status:** Final Specification  
**Scope:** Indian Small & Medium Business Ecosystem, User Personas, Regulatory Frameworks, Domain Terminology, and Behavioral UX Patterns

---

## 1. Indian MSME Ecosystem & Target Segments

India is home to over **63 million Micro, Small, and Medium Enterprises (MSMEs)** contributing ~30% of India's GDP and ~45% of manufacturing output. Over 90% of these businesses operate in the informal or semi-formal retail, trade, and local service sectors.

### Primary Industry Verticals & Workflow Characteristics

| Vertical | Typical Operations | Key Technical & UX Requirements |
| :--- | :--- | :--- |
| **Kirana / Grocery Stores** | High transaction volume, low ticket size (₹20–₹2,000), frequent neighborhood credit (*udhar*), fast-moving items, loose vs packaged items. | Sub-second barcode scanning, quick loose item addition (e.g. 500g sugar), one-click customer udhar recording, WhatsApp reminders. |
| **Apparel & Footwear** | Variant matrix (Size, Color, Brand), seasonal discounts, exchange/returns management, customer loyalty. | Barcode label generation, variant matrix in inventory, return/credit note management, festival marketing broadcasts. |
| **Pharma & Medical Stores** | Strict regulatory batch tracking, manufacturing/expiry dates, salt name search, doctor prescription tagging. | Mandatory batch number, expiry date alerts, drug schedule indicators, near-expiry stock discounting. |
| **Hardware, Electrical & Sanitary** | Thousands of small SKUs, dual pricing (retail vs contractor), credit terms (15–45 days), heavy supplier payables. | Multi-tier price lists (Retail, Wholesale, Electrician), supplier bill tracking, credit limit enforcement, partial payment allocation. |
| **FMCG Distributors & Wholesalers** | High ticket size (₹10,000–₹5,00,000), B2B GST tax invoices, e-Way bills, sales rep routing, multi-warehouse stock. | GSTIN auto-lookup, sequential GST invoicing, e-Way bill JSON export, field salesman roles, collection tracking. |
| **Service Businesses (Repair, Salons, Agencies)** | Labor charges + spare parts, service quotations, advance token payments, milestone billing. | Service catalog without physical stock, quotation-to-invoice conversion, advance payment adjustments, job cards. |

---

## 2. Real User Pain Points & Field Insights

Based on empirical feedback, field observations in Indian wholesale markets (e.g., Surat Textile Market, Sadar Bazaar Delhi, APMC Mandis), and Play Store review analyses:

1. **"Counter Rush Hour" Cognitive Overload:**
   Between 6:00 PM and 9:00 PM, a Kirana shopkeeper serves 3–5 customers simultaneously. If billing takes more than 10 seconds or requires 5 form clicks, the shopkeeper abandons the software and returns to a paper notepad.
   *Design Mandate:* Hotkeys on desktop (`Ctrl+Enter` to save & print), single-tap auto-complete on mobile, default focus on item search.

2. **The "Awkward Payment Reminder" Dilemma:**
   Shopkeepers feel uncomfortable calling neighbors or family friends to demand overdue money.
   *Design Mandate:* Polite, automated, third-party tone WhatsApp reminders with customized regional language templates (e.g., "*Namaste Ramesh ji, aapka VyaparOS par ₹1,450 ka hisaab baki hai...*") with an integrated UPI payment link.

3. **Loss of Connection in Crowded Bazars:**
   Mobile reception drops inside concrete basements and metal-roofed godowns.
   *Design Mandate:* Zero-blocking offline mode. Invoices, customers, and payments must be saved locally to IndexedDB instantly and synced transparently in the background when connectivity resumes.

4. **Multi-Partner & Staff Distrust:**
   Business owners want salesmen to bill items and cashiers to collect cash, but DO NOT want them to see overall business profit margins, supplier purchase costs, or delete past ledger entries.
   *Design Mandate:* Strict Role-Based Access Control (RBAC) with immutable audit logs preventing silent alteration of historic financial records.

---

## 3. Indian Statutory, Legal & Regulatory Framework

### 3.1 Goods and Services Tax (GST) Compliance
All GST-registered businesses in India must adhere to the **Central Goods and Services Tax (CGST) Act, 2017**:

1. **Tax Structure & Calculation:**
   - **Intra-State Sale (Within same State):** Split equally into `CGST` (Central GST) and `SGST` (State GST) or `UTGST` (Union Territory GST).
   - **Inter-State Sale (Between different States):** Calculated as a single `IGST` (Integrated GST) charge.
   - **GST Tax Slabs:** `0%` (Exempt/Nil rated), `5%`, `12%`, `18%`, and `28%`, plus optional Compensation Cess on select luxury/demerit goods.

2. **Mandatory Tax Invoice Fields (Rule 46 of CGST Rules):**
   - Business Legal Name, Trade Name, Address, and 15-digit `GSTIN` of the Supplier.
   - Consecutive serial invoice number (alphanumeric, unique for each Financial Year, e.g., `INV/2026-27/0042`).
   - Date of issue.
   - Name, address, and GSTIN/UIN of recipient (for B2B).
   - Name and address of recipient, delivery address, state name and code (for B2C unregistered where invoice value ≥ ₹50,000).
   - **HSN Code (Harmonized System of Nomenclature)** for goods or **SAC Code (Services Accounting Code)** for services:
     - Turnover up to ₹5 Cr: 4-digit HSN code mandatory for B2B.
     - Turnover > ₹5 Cr: 6-digit HSN code mandatory for all invoices.
   - Item description, Unit of Measurement (UOM: Pcs, Kgs, Box, Mtr), Quantity, Rate per unit, and Total value.
   - Discount or abatement (if any).
   - Taxable value, Tax rates (CGST, SGST, IGST), and Amount of tax charged.
   - Place of Supply along with State Name and 2-digit State Code.
   - Reverse Charge Mechanism (RCM) applicability flag (`Yes` / `No`).
   - Signature or Digital Signature of supplier or authorized representative.

3. **e-Way Bill (Rule 138 of CGST Rules):**
   - Mandatory for movement of goods where consignment value exceeds ₹50,000 (inter-state) or state-specified intra-state thresholds (e.g., ₹1,00,000 in Maharashtra/Delhi).
   - Requires Part A (Consignor, Consignee, HSN, Value) and Part B (Vehicle Number / Transporter ID).

4. **e-Invoicing (Rule 48(4) of CGST Rules):**
   - Mandatory for businesses with aggregate turnover exceeding the notified threshold (currently ₹5 Cr) for B2B supplies.
   - Requires generation of **Invoice Reference Number (IRN)** and signed QR code from the Invoice Registration Portal (IRP).

---

### 3.2 Digital Personal Data Protection Act, 2023 (DPDP Act)
VyaparOS operates as a **Data Fiduciary / Data Processor** under India's DPDP Act:

1. **Consent & Purpose Limitation:**
   - Merchant must obtain lawful basis/consent before recording customer personal identifiers (Name, Phone Number) and dispatching automated communication.
2. **No Unauthorized Cross-Merchant Credit Sharing:**
   - *Strict Prohibition:* Merchant A's ledger data regarding Customer X cannot be sold, pooled, or exposed to Merchant B without explicit, verifiable consent.
   - VyaparOS computes "Payment Reliability Indicators" purely from the isolated history between that specific merchant and customer.
3. **Data Principal Rights:**
   - Support customer data export, correction of inaccurate ledger entries, and secure account deletion workflows.

---

### 3.3 Reserve Bank of India (RBI) & UPI Payment Guidelines
1. **NPCI UPI Deep-Linking Standard:**
   - Generating standard UPI intent URLs formatted as:
     `upi://pay?pa={VPA}&pn={MerchantName}&am={Amount}&cu=INR&tn={InvoiceNo}&tr={RefId}`
   - Support dynamic BharatQR / UPI QR codes printed directly on POS thermal receipts and A4 invoices.
2. **Card Tokenization (RBI Norms):**
   - No raw credit/debit card numbers or CVVs stored in the VyaparOS database. All digital card processing delegated to RBI-licensed Payment Aggregators (e.g., Razorpay, Cashfree, Pine Labs).

---

### 3.4 TRAI DLT & Meta WhatsApp Messaging Regulations
1. **TRAI Distributed Ledger Technology (DLT) Registration:**
   - Transactional SMS must use pre-approved Sender IDs (Header) and registered DLT templates with verified variables (`{#var#}`).
2. **WhatsApp Business Cloud API:**
   - Messages categorized into `UTILITY` (Invoices, payment receipts, balance updates), `AUTHENTICATION` (OTPs), and `MARKETING` (Festival offers, stock arrivals).
   - User opt-out mechanisms mandatory on all automated reminder workflows.

---

## 4. Indian Commercial Terminology & Cultural UX Mapping

To bridge technical accounting with Indian trade reality, VyaparOS embeds dual terminology (English + Indian Business Terms):

| Concept / Action | Indian Trade Term | Local Script (Hindi / Marathi) | UX Representation & Color Code |
| :--- | :--- | :--- | :--- |
| **Total Receivable** | **Lena Hai** / *Baki* | **लेना है / येणे बाकी** | Large Green Stat Card (`#10B981`) with upward arrow |
| **Total Payable** | **Dena Hai** / *Karz* | **देना है / देणे बाकी** | Large Red/Rose Stat Card (`#F43F5E`) with downward arrow |
| **Credit Given (Sale)** | **Udhar Diya** | **उधार दिया / उधारी दिली** | Red badge on transaction feed (Money going out) |
| **Payment Received** | **Jama Kiya** / *Paisa Mila* | **जमा किया / पैसे मिळाले** | Green badge on transaction feed (Money coming in) |
| **Daily Cash Register**| **Rokad / Cashbook** | **रोकड़ / रोजकीर्द** | Clean wallet summary with Net Cash-in-Hand |
| **Customer Ledger** | **Grahak Khata** | **ग्राहक खाता / खातेवही** | Contact-style card with running balance |
| **Supplier Ledger** | **Vyapari / Supplier Hisaab** | **व्यापारी हिसाब / सप्लायर खाते**| Vendor ledger with purchase invoice settlement |
| **Stock In / Purchase** | **Maal Aaya** / *Kharidi* | **माल आया / खरेदी** | Blue inventory badge (`#3B82F6`) |
| **Stock Out / Sale** | **Maal Bika** / *Bikri* | **माल बिका / विक्री** | Emerald inventory badge (`#059669`) |
| **Bill / Estimate** | **Kaccha Bill / Pakka Bill** | **कच्चा बिल / पक्का बिल (GST)**| Clear toggle between GST Tax Invoice & Non-GST Estimate |

---

## 5. Hardware Ecosystem & Deployment Environments

1. **Android Smartphone (Primary Device):**
   - High percentage of mid-range/budget devices (2GB–6GB RAM, MediaTek/Snapdragon 600 series).
   - *Design Mandate:* PWA bundle size < 350KB initial load, zero CSS layout shift, hardware-accelerated animations.
2. **Thermal Receipt Printers (Bluetooth & USB):**
   - 2-inch (58mm) and 3-inch (80mm) ESC/POS thermal printers (TVS, Epson, NGX, generic Chinese Bluetooth printers).
   - *Design Mandate:* Clean ESC/POS text rendering and CSS `@media print` thermal formatting without raster image blur.
3. **Barcode / 2D QR Scanners:**
   - USB HID and Wireless Bluetooth handheld scanners acting as keyboard inputs (`Scan -> Value -> Enter`).
   - *Design Mandate:* Continuous scan listener on POS screen automatically parsing barcodes and incrementing line-item quantity without requiring focus clicking.
4. **Desktop / Laptop (Chrome / Edge / Windows):**
   - Used by wholesale accountants and larger shop counters.
   - *Design Mandate:* Full keyboard navigation (`F1` Help, `F2` New Bill, `F3` Item Search, `F4` Add Customer, `F9` Save & Print).
