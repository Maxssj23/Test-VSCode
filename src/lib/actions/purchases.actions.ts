 'use server';

import { db } from '@/lib/db';
import { purchases, purchaseItems, inventory } from '@/lib/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

import { createAuditLog } from './audit.actions';

const purchaseSchema = z.object({
  vendor: z.string().optional(),
  purchaseDate: z.coerce.date(),
  totalAmount: z.coerce.number(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.coerce.number(),
    unit: z.string().optional(),
    lineTotal: z.coerce.number(),
  })),
});

export async function createPurchase(formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  const purchaseData = {
    vendor: formData.get('vendor'),
    purchaseDate: formData.get('purchaseDate'),
    totalAmount: formData.get('totalAmount'),
    notes: formData.get('notes'),
    items: JSON.parse(formData.get('items') as string),
  };

  const validatedFields = purchaseSchema.safeParse(purchaseData);

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await db.transaction(async (tx) => {
    const [newPurchase] = await tx.insert(purchases).values({
      vendor: validatedFields.data.vendor,
      purchaseDate: validatedFields.data.purchaseDate,
      totalAmount: validatedFields.data.totalAmount.toString(),
      paidByUserId: userId,
      householdId,
      createdBy: userId,
    }).returning();

    if (!newPurchase) {
      throw new Error('Failed to create purchase');
    }

    await createAuditLog({
      entityTable: 'purchases',
      entityId: newPurchase.id,
      action: 'create',
      diffJson: newPurchase,
    });

    for (const item of validatedFields.data.items) {
      await tx.insert(purchaseItems).values({
        purchaseId: newPurchase.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unit: item.unit,
        lineTotal: item.lineTotal.toString(),
      });

      // Update inventory or create new entry
      const existingInventoryItem = await tx.query.inventory.findFirst({
        where: eq(inventory.itemId, item.itemId),
      });

      if (existingInventoryItem) {
        await tx.update(inventory)
          .set({
            quantity: existingInventoryItem.quantity + item.quantity,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, existingInventoryItem.id));
      } else {
        await tx.insert(inventory).values({
          householdId,
          itemId: item.itemId,
          quantity: item.quantity,
          unit: item.unit,
          createdBy: userId,
        });
      }
    }
  });

  revalidatePath('/purchases');
}
