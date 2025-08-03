 'use server';

import { db } from '@/lib/db';
import { budgets } from '@/lib/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

const budgetSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format"),
  limitAmount: z.coerce.number().positive(),
});

export async function createBudget(formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    throw new Error('User is not in a household');
  }

  const validatedFields = budgetSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await db.insert(budgets).values({
    ...validatedFields.data,
    limitAmount: validatedFields.data.limitAmount.toString(),
    householdId,
  });

  revalidatePath('/analytics');
}

export async function updateBudget(budgetId: string, formData: FormData) {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    throw new Error('User is not in a household');
  }

  const validatedFields = budgetSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await db.update(budgets)
    .set({
      ...validatedFields.data,
      limitAmount: validatedFields.data.limitAmount.toString(),
    })
    .where(and(eq(budgets.id, budgetId), eq(budgets.householdId, householdId)));

  revalidatePath('/analytics');
}

export async function deleteBudget(prevState: void, formData: FormData) {
  const budgetId = formData.get('budgetId') as string;
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    throw new Error('User is not in a household');
  }

  await db.delete(budgets).where(and(eq(budgets.id, budgetId), eq(budgets.householdId, householdId)));

  revalidatePath('/analytics');
}

export async function deleteBudgetAction(formData: FormData) {
  await deleteBudget(undefined, formData);
}
