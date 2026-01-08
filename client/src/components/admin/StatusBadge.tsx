import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'completed' | 'failed' | 'operational' | 'warning' | 'error' | 'open' | 'in_progress' | 'resolved' | 'needs_review' | 'high' | 'medium' | 'low';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  inactive: { label: 'Inactive', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  suspended: { label: 'Suspended', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { label: 'Completed', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  failed: { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  operational: { label: 'Operational', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  warning: { label: 'Warning', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  error: { label: 'Error', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  open: { label: 'Open', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'In Progress', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  resolved: { label: 'Resolved', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  needs_review: { label: 'Needs Review', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  high: { label: 'High', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low: { label: 'Low', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge 
      variant="outline" 
      className={cn('font-medium border', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}