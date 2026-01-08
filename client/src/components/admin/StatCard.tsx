import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  testId?: string;
}

export function StatCard({ title, value, icon, change, className, testId }: StatCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:border-primary/30 transition-all duration-300 group",
      className
    )} data-testid={testId}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium tracking-wide">{title}</p>
            <p className="text-3xl font-heading font-bold mt-2 tracking-wide">{value}</p>
            {change && (
              <p className={cn(
                "text-sm mt-2 font-medium",
                change.positive ? "text-emerald-500" : "text-red-500"
              )}>
                {change.positive ? '↑' : '↓'} {Math.abs(change.value)}% from last month
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}