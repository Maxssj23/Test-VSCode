 'use server';

import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function createAuditLog({
  entityTable,
  entityId,
  action,
  diffJson,
}: {
  entityTable: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  diffJson?: object;
}) {
  const session = await auth();
  const householdId = session?.user?.householdId;
  const userId = session?.user?.id;

  if (!householdId || !userId) {
    console.error('Cannot create audit log: Missing householdId or userId');
    return;
  }

  await db.insert(auditLogs).values({
    householdId,
    userId,
    entityTable,
    entityId,
    action,
    diffJson,
  });
}
