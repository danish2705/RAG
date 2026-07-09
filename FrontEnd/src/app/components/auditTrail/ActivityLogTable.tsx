import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Bot, User } from "lucide-react";
import type { AuditEntry } from "../../types/audit";

export function ActivityLogTable({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Timestamp</TableHead>
              <TableHead className="w-48">User/System</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-32">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow
                key={index}
                className={
                  entry.type === "ai"
                    ? "bg-blue-50 dark:bg-blue-900/40 border-l-2 border-l-blue-500 dark:border-l-blue-400"
                    : ""
                }
              >
                <TableCell className="text-sm font-mono">
                  {entry.timestamp}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.type === "ai" ? (
                      <Bot className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{entry.user}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{entry.action}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      entry.type === "ai"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }
                  >
                    {entry.type === "ai" ? "AI" : "Human"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}