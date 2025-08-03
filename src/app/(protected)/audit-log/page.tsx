import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default async function AuditLogPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.householdId, householdId),
    with: {
      user: true,
    },
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Entity Table</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Diff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{format(log.createdAt, 'PPP p')}</TableCell>
              <TableCell>{log.user?.name || 'N/A'}</TableCell>
              <TableCell>{log.entityTable}</TableCell>
              <TableCell>{log.entityId}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{JSON.stringify(log.diffJson)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
