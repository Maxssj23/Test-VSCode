import { pgTable, uuid, text, timestamp, varchar, boolean, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  households: many(households),
  householdMembers: many(householdMembers),
  purchases: many(purchases),
  bills: many(bills),
  billPayments: many(billPayments),
  shoppingList: many(shoppingList),
  auditLogs: many(auditLogs),
}));

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const householdsRelations = relations(households, ({ one, many }) => ({
  createdBy: one(users, { fields: [households.createdBy], references: [users.id] }),
  members: many(householdMembers),
  categories: many(categories),
  items: many(items),
  inventory: many(inventory),
  purchases: many(purchases),
  bills: many(bills),
  budgets: many(budgets),
  expenses: many(expenses),
  wasteEvents: many(wasteEvents),
  shoppingList: many(shoppingList),
  auditLogs: many(auditLogs),
}));

export const householdMembers = pgTable('household_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 50, enum: ['owner', 'member'] }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  household: one(households, { fields: [householdMembers.householdId], references: [households.id] }),
  user: one(users, { fields: [householdMembers.userId], references: [users.id] }),
}));

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50, enum: ['grocery', 'expense'] }).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  household: one(households, { fields: [categories.householdId], references: [households.id] }),
  createdBy: one(users, { fields: [categories.createdBy], references: [users.id] }),
  items: many(items),
  bills: many(bills),
  expenses: many(expenses),
}));

export type Category = typeof categories.$inferSelect;

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  defaultUnit: varchar('default_unit', { length: 50 }),
  defaultCategoryId: uuid('default_category_id').references(() => categories.id),
  perishable: boolean('perishable').default(false).notNull(),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
  household: one(households, { fields: [items.householdId], references: [households.id] }),
  defaultCategory: one(categories, { fields: [items.defaultCategoryId], references: [categories.id] }),
  inventory: many(inventory),
  purchaseItems: many(purchaseItems),
  wasteEvents: many(wasteEvents),
}));

export type Item = typeof items.$inferSelect;

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  itemId: uuid('item_id').references(() => items.id).notNull(),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }),
  storage: varchar('storage', { length: 50, enum: ['pantry', 'fridge', 'freezer', 'other'] }),
  purchaseDate: timestamp('purchase_date'),
  expiryDate: timestamp('expiry_date'),
  costTotal: decimal('cost_total', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inventoryRelations = relations(inventory, ({ one }) => ({
  household: one(households, { fields: [inventory.householdId], references: [households.id] }),
  item: one(items, { fields: [inventory.itemId], references: [items.id] }),
  createdBy: one(users, { fields: [inventory.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [inventory.updatedBy], references: [users.id] }),
}));

export type Inventory = typeof inventory.$inferSelect;

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidByUserId: uuid('paid_by_user_id').references(() => users.id).notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  household: one(households, { fields: [purchases.householdId], references: [households.id] }),
  paidByUser: one(users, { fields: [purchases.paidByUserId], references: [users.id] }),
  createdBy: one(users, { fields: [purchases.createdBy], references: [users.id] }),
  purchaseItems: many(purchaseItems),
}));

export type Purchase = typeof purchases.$inferSelect;

export const purchaseItems = pgTable('purchase_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseId: uuid('purchase_id').references(() => purchases.id).notNull(),
  itemId: uuid('item_id').references(() => items.id).notNull(),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }),
  lineTotal: decimal('line_total', { precision: 10, scale: 2 }).notNull(),
});

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, { fields: [purchaseItems.purchaseId], references: [purchases.id] }),
  item: one(items, { fields: [purchaseItems.itemId], references: [items.id] }),
}));

export type PurchaseItem = typeof purchaseItems.$inferSelect;

export const bills = pgTable('bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: varchar('status', { length: 50, enum: ['pending', 'paid', 'overdue'] }).notNull(),
  recurringRule: varchar('recurring_rule', { length: 255 }),
  categoryId: uuid('category_id').references(() => categories.id),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const billsRelations = relations(bills, ({ one, many }) => ({
  household: one(households, { fields: [bills.householdId], references: [households.id] }),
  category: one(categories, { fields: [bills.categoryId], references: [categories.id] }),
  createdBy: one(users, { fields: [bills.createdBy], references: [users.id] }),
  billPayments: many(billPayments),
}));

export const billPayments = pgTable('bill_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  billId: uuid('bill_id').references(() => bills.id).notNull(),
  paidOn: timestamp('paid_on').defaultNow().notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paidByUserId: uuid('paid_by_user_id').references(() => users.id).notNull(),
  method: varchar('method', { length: 50 }),
  notes: text('notes'),
});

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(bills, { fields: [billPayments.billId], references: [bills.id] }),
  paidByUser: one(users, { fields: [billPayments.paidByUserId], references: [users.id] }),
}));

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
  limitAmount: decimal('limit_amount', { precision: 10, scale: 2 }).notNull(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  household: one(households, { fields: [budgets.householdId], references: [households.id] }),
}));

export type Budget = typeof budgets.$inferSelect;

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  date: timestamp('date').defaultNow().notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  description: text('description'),
  source: varchar('source', { length: 50, enum: ['purchase', 'bill', 'other'] }).notNull(),
  linkedEntityId: uuid('linked_entity_id'),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
  household: one(households, { fields: [expenses.householdId], references: [households.id] }),
  category: one(categories, { fields: [expenses.categoryId], references: [categories.id] }),
}));

export const wasteEvents = pgTable('waste_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  inventoryId: uuid('inventory_id').references(() => inventory.id).notNull(),
  itemId: uuid('item_id').references(() => items.id).notNull(),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }),
  reason: varchar('reason', { length: 50, enum: ['expired', 'spoiled', 'leftover', 'other'] }).notNull(),
  eventDate: timestamp('event_date').defaultNow().notNull(),
});

export const wasteEventsRelations = relations(wasteEvents, ({ one }) => ({
  household: one(households, { fields: [wasteEvents.householdId], references: [households.id] }),
  inventory: one(inventory, { fields: [wasteEvents.inventoryId], references: [inventory.id] }),
  item: one(items, { fields: [wasteEvents.itemId], references: [items.id] }),
}));

export const shoppingList = pgTable('shopping_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  addedByUserId: uuid('added_by_user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  purchasedAt: timestamp('purchased_at'),
});

export const shoppingListRelations = relations(shoppingList, ({ one }) => ({
  household: one(households, { fields: [shoppingList.householdId], references: [households.id] }),
  addedByUser: one(users, { fields: [shoppingList.addedByUserId], references: [users.id] }),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  entityTable: varchar('entity_table', { length: 255 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50, enum: ['create', 'update', 'delete'] }).notNull(),
  diffJson: jsonb('diff_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  household: one(households, { fields: [auditLogs.householdId], references: [households.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));