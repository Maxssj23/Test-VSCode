 'use server';

import { db } from '@/lib/db';
import { bills, billPayments, expenses } from '@/lib/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

import { createAuditLog } from './audit.actions';

const billSchema = z.object({
  name: z.string().min(1),
  vendor: z.string().optional(),
  amount: z.coerce.number(),
  dueDate: z.coerce.date(),
  status: z.enum(['pending', 'paid', 'overdue']).default('pending'),
  recurringRule: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function createBill(formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  const validatedFields = billSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const [newBill] = await db.insert(bills).values({
    ...validatedFields.data,
    householdId,
    createdBy: userId,
  }).returning();

  if (newBill) {
    await createAuditLog({
      entityTable: 'bills',
      entityId: newBill.id,
      action: 'create',
      diffJson: newBill,
    });
  }

  revalidatePath('/bills');
}

export async function updateBill(billId: string, formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return { error: 'User is not in a household' };
  }

  const validatedFields = billSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const [oldBill] = await db.select().from(bills).where(eq(bills.id, billId));

  await db.update(bills).set(validatedFields.data).where(eq(bills.id, billId));

  const [updatedBill] = await db.select().from(bills).where(eq(bills.id, billId));

  if (oldBill && updatedBill) {
    await createAuditLog({
      entityTable: 'bills',
      entityId: updatedBill.id,
      action: 'update',
      diffJson: { old: oldBill, new: updatedBill },
    });
  }

  revalidatePath('/bills');
}

export async function deleteBill(billId: string) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return { error: 'User is not in a household' };
  }

  const [deletedBill] = await db.delete(bills).where(eq(bills.id, billId)).returning();

  if (deletedBill) {
    await createAuditLog({
      entityTable: 'bills',
      entityId: deletedBill.id,
      action: 'delete',
      diffJson: deletedBill,
    });
  }

  revalidatePath('/bills');
}

export async function markBillAsPaid(billId: string, amount: number) {
  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    return { error: 'User is not in a household' };
  }

  await db.transaction(async (tx) => {
    const [newPayment] = await tx.insert(billPayments).values({
      billId,
      paidByUserId: userId,
      amount: amount.toString(),
    }).returning();

    if (newPayment) {
      await createAuditLog({
        entityTable: 'bill_payments',
        entityId: newPayment.id,
        action: 'create',
        diffJson: newPayment,
      });
    }

    await tx.update(bills).set({ status: 'paid' }).where(eq(bills.id, billId));

    // Create an expense record
    const [bill] = await tx.select().from(bills).where(eq(bills.id, billId));
    if (bill) {
      const [newExpense] = await tx.insert(expenses).values({
        householdId,
        date: new Date(),
        amount: amount.toString(),
        categoryId: bill.categoryId,
        description: `Bill payment for ${bill.name}`,
        source: 'bill',
        linkedEntityId: bill.id,
      }).returning();

      if (newExpense) {
        await createAuditLog({
          entityTable: 'expenses',
          entityId: newExpense.id,
          action: 'create',
          diffJson: newExpense,
        });
      }
    }
  });

  revalidatePath('/bills');
}
