import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet,
  TrendingUp,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  RefreshCw,
  Plus,
  RotateCcw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { payments, revenueData } from '@/lib/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const failedCount = payments.filter(p => p.status === 'failed').length;

  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (p: typeof payments[0]) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{p.id}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-copy-${p.id}`}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Customer',
      render: (p: typeof payments[0]) => (
        <span className="text-sm font-medium">{p.user}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (p: typeof payments[0]) => (
        <Badge variant="outline">{p.plan}</Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p: typeof payments[0]) => (
        <span className="font-heading font-bold">৳{p.amount}</span>
      ),
    },
    {
      key: 'bkashId',
      header: 'Bkash ID',
      render: (p: typeof payments[0]) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{p.bkashId}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-verify-${p.id}`}>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: typeof payments[0]) => <StatusBadge status={p.status as any} />,
    },
    {
      key: 'date',
      header: 'Date',
      render: (p: typeof payments[0]) => (
        <span className="text-sm text-muted-foreground">{p.date}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (p: typeof payments[0]) => (
        <div className="flex items-center gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-${p.id}`}>
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Transaction Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">Transaction ID</p>
                    <p className="font-mono font-medium mt-1">{p.id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">Bkash ID</p>
                    <p className="font-mono font-medium mt-1">{p.bkashId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">Customer</p>
                    <p className="font-medium mt-1">{p.user}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">Plan</p>
                    <p className="font-medium mt-1">{p.plan}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">Amount</p>
                    <p className="font-heading font-bold text-xl mt-1">৳{p.amount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    <div className="mt-1"><StatusBadge status={p.status as any} /></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">Date & Time</p>
                  <p className="font-medium mt-1">{p.date}</p>
                </div>
                {p.status === 'failed' && (
                  <Button className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Payment
                  </Button>
                )}
                {p.status === 'completed' && (
                  <Button variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {p.status === 'pending' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" data-testid={`button-approve-${p.id}`}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Payment Management" subtitle="Manage Bkash transactions and revenue">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={`৳${totalRevenue.toLocaleString()}`}
          icon={<Wallet className="h-6 w-6" />}
          change={{ value: 18.5, positive: true }}
          testId="stat-total-revenue"
        />
        <StatCard
          title="This Month"
          value="৳234,560"
          icon={<TrendingUp className="h-6 w-6" />}
          change={{ value: 12.3, positive: true }}
          testId="stat-monthly-revenue"
        />
        <StatCard
          title="Pending"
          value={`৳${pendingAmount.toLocaleString()}`}
          icon={<RefreshCw className="h-6 w-6" />}
          testId="stat-pending"
        />
        <StatCard
          title="Failed Transactions"
          value={failedCount.toString()}
          icon={<XCircle className="h-6 w-6" />}
          testId="stat-failed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(173, 58%, 45%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(173, 58%, 45%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                  <XAxis dataKey="month" stroke="hsl(0, 0%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(0, 0%, 45%)" fontSize={12} tickFormatter={(v) => `৳${v/1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 10%)',
                      border: '1px solid hsl(0, 0%, 20%)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(173, 58%, 45%)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-manual-payment">
                  <Plus className="h-4 w-4" />
                  Manual Payment Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Manual Payment Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Customer Email</Label>
                    <Input placeholder="user@example.com" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Bkash Transaction ID</Label>
                    <Input placeholder="BK123456789" className="mt-1.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount (BDT)</Label>
                      <Input type="number" placeholder="799" className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <Select>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">Add Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-sync-bkash">
              <RefreshCw className="h-4 w-4" />
              Sync Bkash Transactions
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-export-report">
              <TrendingUp className="h-4 w-4" />
              Generate Revenue Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filteredPayments}
        columns={columns}
        searchPlaceholder="Search transactions..."
        testIdPrefix="payments"
      />
    </AdminLayout>
  );
}