import { cn } from "@/lib/utils";
import { glass, motion } from "@/lib/design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/design-system/empty-state";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  emptyTitle?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "No records found",
  emptyTitle = "Nothing here yet",
  onEmptyAction,
  emptyActionLabel,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={cn(glass.panel, motion.fadeIn, "overflow-hidden p-0")}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-white/50 backdrop-blur-xl dark:bg-zinc-900/70">
          <TableRow className="border-white/10 hover:bg-transparent dark:border-white/5">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={rowKey(row)}
              className="border-white/10 transition-colors dark:border-white/5"
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
