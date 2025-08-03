 'use server';

import { db } from '@/lib/db';
import { shoppingList, purchases, purchaseItems, inventory } from '@/lib/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';

import { createAuditLog } from './audit.actions';

const shoppingListItemSchema = z.object({
  itemName: z.string().min(1),
});

export async function addShoppingListItem(formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  const validatedFields = shoppingListItemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const [newItem] = await db.insert(shoppingList).values({
    ...validatedFields.data,
    householdId,
    addedByUserId: userId,
  }).returning();

  if (newItem) {
    await createAuditLog({
      entityTable: 'shopping_list',
      entityId: newItem.id,
      action: 'create',
      diffJson: newItem,
    });
  }

  revalidatePath('/shopping-list');
}

export async function markShoppingListItemPurchased(itemId: string) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return { error: 'User is not in a household' };
  }

  const [oldItem] = await db.select().from(shoppingList).where(eq(shoppingList.id, itemId));

  await db.update(shoppingList)
    .set({ purchasedAt: new Date() })
    .where(and(eq(shoppingList.id, itemId), eq(shoppingList.householdId, householdId)));

  const [updatedItem] = await db.select().from(shoppingList).where(eq(shoppingList.id, itemId));

  if (oldItem && updatedItem) {
    await createAuditLog({
      entityTable: 'shopping_list',
      entityId: updatedItem.id,
      action: 'update',
      diffJson: { old: oldItem, new: updatedItem },
    });
  }

  revalidatePath('/shopping-list');
}

export async function promoteShoppingListToPurchase(itemIds: string[]) {
  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  const itemsToPurchase = await db.query.shoppingList.findMany({
    where: and(
      eq(shoppingList.householdId, householdId),
      isNull(shoppingList.purchasedAt),
      shoppingList.id.inArray(itemIds)
    ),
    with: {
      addedByUser: true,
    },
  });

  if (itemsToPurchase.length === 0) {
    return { error: 'No items selected for purchase' };
  }

  await db.transaction(async (tx) => {
    const [newPurchase] = await tx.insert(purchases).values({
      householdId,
      vendor: 'Shopping List Purchase',
      totalAmount: '0', // Will be updated later if we add price to shopping list
      paidByUserId: userId,
      createdBy: userId,
    }).returning();

    if (!newPurchase) {
      throw new Error('Failed to create purchase from shopping list');
    }

    await createAuditLog({
      entityTable: 'purchases',
      entityId: newPurchase.id,
      action: 'create',
      diffJson: newPurchase,
    });

    for (const item of itemsToPurchase) {
      // Insert into purchaseItems
      const [newPurchaseItem] = await tx.insert(purchaseItems).values({
        purchaseId: newPurchase.id,
        itemId: item.id, // Assuming shopping list item ID can be item catalog ID
        quantity: 1, // Default to 1 for now, can be updated later
        unit: 'unit', // Default to 'unit', can be updated later
        lineTotal: '0', // Default to 0, can be updated later
      }).returning();

      if (newPurchaseItem) {
        await createAuditLog({
          entityTable: 'purchase_items',
          entityId: newPurchaseItem.id,
          action: 'create',
          diffJson: newPurchaseItem,
        });
      }

      // Update inventory or create new entry
      const existingInventoryItem = await tx.query.inventory.findFirst({
        where: eq(inventory.itemId, item.id), // Assuming shopping list item ID can be item catalog ID
      });

      if (existingInventoryItem) {
        await tx.update(inventory)
          .set({
            quantity: existingInventoryItem.quantity + 1, // Default to 1 for now
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, existingInventoryItem.id));

        await createAuditLog({
          entityTable: 'inventory',
          entityId: existingInventoryItem.id,
          action: 'update',
          diffJson: { old: existingInventoryItem, new: { ...existingInventoryItem, quantity: existingInventoryItem.quantity + 1 } },
        });
      } else {
        const [newInventoryItem] = await tx.insert(inventory).values({
          householdId,
          itemId: item.id, // Assuming shopping list item ID can be item catalog ID
          quantity: 1, // Default to 1 for now
          unit: 'unit', // Default to 'unit', can be updated later
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
      }

      // Mark shopping list item as purchased
      const [oldShoppingListItem] = await tx.select().from(shoppingList).where(eq(shoppingList.id, item.id));

      await tx.update(shoppingList)
        .set({ purchasedAt: new Date() })
        .where(eq(shoppingList.id, item.id));

      const [updatedShoppingListItem] = await tx.select().from(shoppingList).where(eq(shoppingList.id, item.id));

      if (oldShoppingListItem && updatedShoppingListItem) {
        await createAuditLog({
          entityTable: 'shopping_list',
          entityId: updatedShoppingListItem.id,
          action: 'update',
          diffJson: { old: oldShoppingListItem, new: updatedShoppingListItem },
        });
      }
    }
  });

  revalidatePath('/shopping-list');
  revalidatePath('/purchases');
  revalidatePath('/inventory');
}
