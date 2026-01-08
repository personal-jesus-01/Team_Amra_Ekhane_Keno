import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollText,
  Filter,
  Calendar,
  User,
  Activity,
  Shield,
  Download,
  RefreshCw,
} from 'lucide-react';
import { auditLogs } from '@/lib/mockData';

export default function Logs() {
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'all') {
      const actionType = log.action.toLowerCase();
      if (actionFilter === 'user' && !actionType.includes('user')) return false;
      if (actionFilter === 'payment' && !actionType.includes('refund') && !actionType.includes('payment')) return false;
      if (actionFilter === 'system' && !actionType.includes('backup') && !actionType.includes('plan')) return false;
      if (actionFilter === 'ticket' && !actionType.includes('ticket')) return false;
    }
    return true;
  });

  const getActionColor = (action: string) => {
    if (action.includes('suspend') || action.includes('delete')) return 'text-red-400';
    if (action.includes('Refund')) return 'text-yellow-400';
    if (action.includes('backup')) return 'text-blue-400';
    if (action.includes('resolved') || action.includes('added')) return 'text-emerald-400';
    return 'text-muted-foreground';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('User')) return User;
    if (action.includes('Refund') || action.includes('Payment')) return Activity;
    if (action.includes('backup')) return RefreshCw;
    if (action.includes('Ticket')) return ScrollText;
    return Shield;
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: typeof auditLogs[0]) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{log.timestamp}</span>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      render: (log: typeof auditLogs[0]) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-sm">{log.admin}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: typeof auditLogs[0]) => {
        const Icon = getActionIcon(log.action);
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${getActionColor(log.action)}`} />
            <span className={`font-medium text-sm ${getActionColor(log.action)}`}>{log.action}</span>
          </div>
        );
      },
    },
    {
      key: 'target',
      header: 'Target',
      render: (log: typeof auditLogs[0]) => (
        <Badge variant="outline" className="font-mono">{log.target}</Badge>
      ),
    },
    {
      key: 'ip',
      header: 'IP Address',
      render: (log: typeof auditLogs[0]) => (
        <span className="font-mono text-sm text-muted-foreground">{log.ip}</span>
      ),
    },
  ];

  return (
    <AdminLayout title="Audit Logs" subtitle="Track all administrative actions">
      <Card className="border-border/50 mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36" data-testid="filter-action">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user">User Actions</SelectItem>
                  <SelectItem value="payment">Payment Actions</SelectItem>
                  <SelectItem value="system">System Actions</SelectItem>
                  <SelectItem value="ticket">Ticket Actions</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" className="w-40" data-testid="filter-date-from" />
              <span className="text-muted-foreground">to</span>
              <Input type="date" className="w-40" data-testid="filter-date-to" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">247</p>
              <p className="text-xs text-muted-foreground">Actions Today</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">5</p>
              <p className="text-xs text-muted-foreground">Active Admins</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">3</p>
              <p className="text-xs text-muted-foreground">Critical Actions</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <ScrollText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">1,842</p>
              <p className="text-xs text-muted-foreground">Total This Month</p>
            </div>
          </div>
        </Card>
      </div>

      <DataTable
        data={filteredLogs}
        columns={columns}
        searchPlaceholder="Search logs..."
        testIdPrefix="logs"
      />

      <Card className="border-border/50 mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Critical Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <User className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="font-medium">User suspended</p>
                  <p className="text-xs text-muted-foreground">nadia@example.com by Super Admin</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2025-01-07 15:30:22</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Activity className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium">Refund processed</p>
                  <p className="text-xs text-muted-foreground">TXN005 - ৳299 by Support Admin</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2025-01-07 14:22:15</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Plan modified</p>
                  <p className="text-xs text-muted-foreground">Pro Plan pricing updated by Super Admin</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2025-01-07 12:15:45</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}