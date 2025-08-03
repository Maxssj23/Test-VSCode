'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface AuditLogTableProps {
  logs: {
    id: string;
    createdAt: Date;
    user: { name: string | null } | null;
    entityTable: string;
    entityId: string;
    action: string;
    diffJson: unknown;
  }[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
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
  );
}
