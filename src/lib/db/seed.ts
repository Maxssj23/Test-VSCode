import { db } from './index';
import * as schema from './schema';
import { exit } from 'process';

const main = async () => {
  console.log('Seeding database...');

  // Your seeding logic will go here
  const [user] = await db.insert(schema.users).values({
    email: 'user@example.com',
    name: 'Test User',
  }).returning();

  const [household] = await db.insert(schema.households).values({
    name: 'My Home',
    createdBy: user.id,
  }).returning();

  await db.insert(schema.householdMembers).values({
    householdId: household.id,
    userId: user.id,
    role: 'owner',
  });

  const [groceryCategory] = await db.insert(schema.categories).values({
    householdId: household.id,
    name: 'Groceries',
    type: 'grocery',
    createdBy: user.id,
  }).returning();

  const [expenseCategory] = await db.insert(schema.categories).values({
    householdId: household.id,
    name: 'Utilities',
    type: 'expense',
    createdBy: user.id,
  }).returning();

  const [item1] = await db.insert(schema.items).values({
    householdId: household.id,
    name: 'Milk',
    defaultUnit: 'gallon',
    defaultCategoryId: groceryCategory.id,
    perishable: true,
  }).returning();

  await db.insert(schema.inventory).values({
    householdId: household.id,
    itemId: item1.id,
    quantity: 1,
    unit: 'gallon',
    storage: 'fridge',
    purchaseDate: new Date(),
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    costTotal: '3.50',
    createdBy: user.id,
  });

  const [purchase] = await db.insert(schema.purchases).values({
    householdId: household.id,
    vendor: 'Supermarket',
    totalAmount: '3.50',
    paidByUserId: user.id,
    createdBy: user.id,
  }).returning();

  await db.insert(schema.purchaseItems).values({
    purchaseId: purchase.id,
    itemId: item1.id,
    quantity: 1,
    unit: 'gallon',
    lineTotal: '3.50',
  });

  await db.insert(schema.bills).values({
    householdId: household.id,
    name: 'Internet Bill',
    vendor: 'ISP',
    amount: '60.00',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
    status: 'pending',
    categoryId: expenseCategory.id,
    createdBy: user.id,
  });

  await db.insert(schema.budgets).values({
    householdId: household.id,
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    limitAmount: '500.00',
  });

  await db.insert(schema.wasteEvents).values({
    householdId: household.id,
    inventoryId: (await db.query.inventory.findFirst())!.id,
    itemId: item1.id,
    quantity: 1,
    unit: 'gallon',
    reason: 'expired',
  });

  console.log('Database seeded successfully!');
  exit(0);
};

main();
