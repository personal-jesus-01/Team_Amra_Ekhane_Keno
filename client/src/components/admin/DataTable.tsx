import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: ReactNode;
  testIdPrefix?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  actions,
  testIdPrefix = "table",
}: DataTableProps<T>) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10 w-full sm:w-64 bg-background/50"
            onChange={(e) => onSearch?.(e.target.value)}
            data-testid={`${testIdPrefix}-search`}
          />
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button variant="outline" size="sm" data-testid={`${testIdPrefix}-export`}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={`font-heading text-xs tracking-wider uppercase ${col.className || ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={item.id}
                className="border-border/50 hover:bg-accent/50 transition-colors"
                data-testid={`${testIdPrefix}-row-${item.id}`}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border-t border-border/50 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{data.length}</span> results
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" data-testid={`${testIdPrefix}-prev`}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 bg-primary text-primary-foreground border-primary">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8">2</Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8">3</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" data-testid={`${testIdPrefix}-next`}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}