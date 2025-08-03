import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { AuditLogTable } from '@/components/audit-log/audit-log-table';

type AuditLogWithUser = {
  id: string;
  createdAt: Date;
  user: { name: string | null } | null;
  entityTable: string;
  entityId: string;
  action: string;
  diffJson: unknown;
};

export default async function AuditLogPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const logs = (await db.query.auditLogs.findMany({
    where: eq(auditLogs.householdId, householdId),
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
    columns: {
      id: true,
      createdAt: true,
      entityTable: true,
      entityId: true,
      action: true,
      diffJson: true,
    },
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
  })).map(log => ({
    ...log,
    id: String(log.id),
  })) as AuditLogWithUser[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>
      <AuditLogTable logs={logs} />
    </div>
  );
}
