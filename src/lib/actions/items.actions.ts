 'use server';

import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';

import { eq } from 'drizzle-orm';

import { createAuditLog } from './audit.actions';

const itemSchema = z.object({
  name: z.string().min(1),
  defaultUnit: z.string().optional(),
  perishable: z.boolean(),
});

export async function createItem(prevState: { error: string } | undefined, formData: FormData) {
  const validatedFields = itemSchema.safeParse({
    name: formData.get('name'),
    defaultUnit: formData.get('defaultUnit'),
    perishable: formData.get('perishable') === 'on',
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return { error: 'User is not in a household' };
  }

  const [newItem] = await db.insert(items).values({
    ...validatedFields.data,
    householdId,
  }).returning();

  if (newItem) {
    await createAuditLog({
      entityTable: 'items',
      entityId: newItem.id,
      action: 'create',
      diffJson: newItem,
    });
  }

  revalidatePath('/groceries');
}

export async function updateItem(itemId: string, formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return { error: 'User is not in a household' };
  }

  const validatedFields = itemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const [oldItem] = await db.select().from(items).where(eq(items.id, itemId));

  await db
    .update(items)
    .set(validatedFields.data)
    .where(eq(items.id, itemId));

  const [updatedItem] = await db.select().from(items).where(eq(items.id, itemId));

  if (oldItem && updatedItem) {
    await createAuditLog({
      entityTable: 'items',
      entityId: updatedItem.id,
      action: 'update',
      diffJson: { old: oldItem, new: updatedItem },
    });
  }

  revalidatePath('/groceries');
}

export async function deleteItem(itemId: string, _formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    throw new Error('User is not in a household');
  }

  const [deletedItem] = await db.delete(items).where(eq(items.id, itemId)).returning();

  if (deletedItem) {
    await createAuditLog({
      entityTable: 'items',
      entityId: deletedItem.id,
      action: 'delete',
      diffJson: deletedItem,
    });
  }

  revalidatePath('/groceries');
}
