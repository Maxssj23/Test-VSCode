'use server';

import { db } from '@/lib/db';
import { inventory } from '@/lib/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { createAuditLog } from './audit.actions';

const inventoryItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number(),
  unit: z.string().optional(),
  storage: z.enum(['pantry', 'fridge', 'freezer', 'other']).optional(),
  purchaseDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  costTotal: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export async function createInventoryItem(formData: FormData) {
  const validatedFields = inventoryItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  const [newInventoryItem] = await db.insert(inventory).values({
    ...validatedFields.data,
    householdId,
    createdBy: userId,
  }).returning();

  if (newInventoryItem) {
    await createAuditLog({
      entityTable: 'inventory',
      entityId: newInventoryItem.id,
      action: 'create',
      diffJson: newInventoryItem,
    });
  }

  revalidatePath('/inventory');
}

export async function updateInventoryItem(inventoryItemId: string, formData: FormData) {
  const validatedFields = inventoryItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  const [oldInventoryItem] = await db.select().from(inventory).where(eq(inventory.id, inventoryItemId));

  await db
    .update(inventory)
    .set({
      ...validatedFields.data,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(inventory.id, inventoryItemId));

  const [updatedInventoryItem] = await db.select().from(inventory).where(eq(inventory.id, inventoryItemId));

  if (oldInventoryItem && updatedInventoryItem) {
    await createAuditLog({
      entityTable: 'inventory',
      entityId: updatedInventoryItem.id,
      action: 'update',
      diffJson: { old: oldInventoryItem, new: updatedInventoryItem },
    });
  }

  revalidatePath('/inventory');
}

export async function deleteInventoryItem(inventoryItemId: string, _formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    throw new Error('User is not in a household');
  }

  const [deletedInventoryItem] = await db.delete(inventory).where(eq(inventory.id, inventoryItemId)).returning();

  if (deletedInventoryItem) {
    await createAuditLog({
      entityTable: 'inventory',
      entityId: deletedInventoryItem.id,
      action: 'delete',
      diffJson: deletedInventoryItem,
    });
  }

  revalidatePath('/inventory');
}