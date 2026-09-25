const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding VyaparOS database with realistic Indian merchant data...');

  // Clean old records
  await prisma.transactionEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Default Owner User
  const user = await prisma.user.create({
    data: {
      firebaseUid: 'demo_kirana_owner',
      fullName: 'Ramesh Kumar',
      phoneNumber: '9876543210',
      email: 'ramesh@kirana.test',
      globalRole: 'SHOPKEEPER',
    },
  });

  // 2. Create Business (Kirana Store)
  const business = await prisma.business.create({
    data: {
      ownerUserId: user.id,
      name: 'Ramesh Kirana & General Store',
      legalName: 'Ramesh Kumar Trading Co.',
      businessType: 'retail',
      currency: 'INR',
      gstin: '27AAAAA0000A1Z5',
      upiVpa: 'rameshkirana@okaxis',
    },
  });

  // 3. Create Main Branch
  const branch = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: 'Main Counter (Market Road)',
      branchCode: 'MAIN',
      isMainBranch: true,
      addressLine1: 'Shop #4, Gandhi Market Road',
      city: 'Pune',
      stateCode: '27',
      stateName: 'Maharashtra',
      pincode: '411002',
      contactPhone: '9876543210',
    },
  });

  // 4. Create System Roles
  const ownerRole = await prisma.role.create({
    data: {
      businessId: business.id,
      roleKey: 'OWNER',
      displayName: 'Business Owner',
      isSystemDefault: true,
    },
  });

  // 5. Create Business Membership
  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      userId: user.id,
      roleId: ownerRole.id,
      status: 'ACTIVE',
    },
  });

  // 6. Create Realistic Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Suresh Patil (Local Builder)',
      phoneNumber: '9822011223',
      address: 'Plot 12, Shiv Nagar, Pune',
      openingBalance: 0,
      outstandingBalance: 3500.0,
      paymentTermsDays: 15,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Anjali Sharma (Society)',
      phoneNumber: '9890123456',
      address: 'Flat 302, Gokul Heights',
      openingBalance: 0,
      outstandingBalance: 1250.0,
      paymentTermsDays: 7,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Vikram Joshi (Tea Stall)',
      phoneNumber: '9765432190',
      address: 'Near City Bus Stand',
      openingBalance: 0,
      outstandingBalance: 0.0, // Settled
      paymentTermsDays: 3,
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Pooja Verma (Regular Customer)',
      phoneNumber: '9421098765',
      address: 'Lane 4, Laxmi Road',
      openingBalance: 0,
      outstandingBalance: -500.0, // Advance
      paymentTermsDays: 30,
    },
  });

  // 7. Create Sample Transactions with Double-Entry Journal Legs
  // Txn 1: Udhar to Suresh Patil (5000)
  const txn1 = await prisma.transaction.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      customerId: customer1.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 5000.0,
      paymentMode: 'CREDIT',
      description: '5 Bags Basmati Rice, 2 Tins Oil',
      createdByUserId: user.id,
      transactionDate: new Date(Date.now() - 4 * 86400000), // 4 days ago
    },
  });
  await prisma.transactionEntry.createMany({
    data: [
      { transactionId: txn1.id, accountType: 'ACCOUNTS_RECEIVABLE', entryType: 'DEBIT', amount: 5000.0 },
      { transactionId: txn1.id, accountType: 'SALES_REVENUE', entryType: 'CREDIT', amount: 5000.0 },
    ],
  });

  // Txn 2: Partial Payment from Suresh Patil (1500)
  const txn2 = await prisma.transaction.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      customerId: customer1.id,
      transactionType: 'PAYMENT_RECEIVED',
      amount: 1500.0,
      paymentMode: 'UPI',
      paymentReference: 'UPI/423985729103/GPay',
      description: 'Partial UPI payment received',
      createdByUserId: user.id,
      transactionDate: new Date(Date.now() - 2 * 86400000), // 2 days ago
    },
  });
  await prisma.transactionEntry.createMany({
    data: [
      { transactionId: txn2.id, accountType: 'BANK_ACCOUNT', entryType: 'DEBIT', amount: 1500.0 },
      { transactionId: txn2.id, accountType: 'ACCOUNTS_RECEIVABLE', entryType: 'CREDIT', amount: 1500.0 },
    ],
  });

  // Txn 3: Udhar to Anjali Sharma (1250)
  const txn3 = await prisma.transaction.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      customerId: customer2.id,
      transactionType: 'CREDIT_GIVEN',
      amount: 1250.0,
      paymentMode: 'CREDIT',
      description: 'Monthly Groceries list',
      createdByUserId: user.id,
      transactionDate: new Date(Date.now() - 1 * 86400000), // yesterday
    },
  });
  await prisma.transactionEntry.createMany({
    data: [
      { transactionId: txn3.id, accountType: 'ACCOUNTS_RECEIVABLE', entryType: 'DEBIT', amount: 1250.0 },
      { transactionId: txn3.id, accountType: 'SALES_REVENUE', entryType: 'CREDIT', amount: 1250.0 },
    ],
  });

  // Txn 4: Advance Payment from Pooja Verma (500)
  const txn4 = await prisma.transaction.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      customerId: customer4.id,
      transactionType: 'PAYMENT_RECEIVED',
      amount: 500.0,
      paymentMode: 'CASH',
      description: 'Advance deposit for dry fruits order',
      createdByUserId: user.id,
      transactionDate: new Date(),
    },
  });
  await prisma.transactionEntry.createMany({
    data: [
      { transactionId: txn4.id, accountType: 'CASH_IN_HAND', entryType: 'DEBIT', amount: 500.0 },
      { transactionId: txn4.id, accountType: 'ACCOUNTS_RECEIVABLE', entryType: 'CREDIT', amount: 500.0 },
    ],
  });

  console.log('✅ VyaparOS Seed Data successfully loaded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
