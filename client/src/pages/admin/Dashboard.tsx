import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  CreditCard,
  Presentation,
  Brain,
  TrendingUp,
  UserPlus,
  FileText,
  Mic,
  Crown,
  Scan,
  Server,
  Database,
  HardDrive,
  Wallet,
  Activity,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react';
import { dashboardStats, recentActivities, systemHealth, revenueData } from '@/lib/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const activityIcons: Record<string, any> = {
  'user-plus': UserPlus,
  'presentation': Presentation,
  'credit-card': CreditCard,
  'mic': Mic,
  'crown': Crown,
  'scan': Scan,
};

export default function Dashboard() {
  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back, Super Admin">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers.toLocaleString()}
          icon={<Users className="h-6 w-6" />}
          change={{ value: 12.5, positive: true }}
          testId="stat-total-users"
        />
        <StatCard
          title="Active Subscriptions"
          value={dashboardStats.activeSubscriptions.toLocaleString()}
          icon={<CreditCard className="h-6 w-6" />}
          change={{ value: 8.2, positive: true }}
          testId="stat-subscriptions"
        />
        <StatCard
          title="Slides Today"
          value={dashboardStats.slidesToday.toLocaleString()}
          icon={<Presentation className="h-6 w-6" />}
          change={{ value: 23.1, positive: true }}
          testId="stat-slides-today"
        />
        <StatCard
          title="AI Credits Used"
          value={(dashboardStats.aiCreditsConsumed / 1000).toFixed(1) + 'K'}
          icon={<Brain className="h-6 w-6" />}
          change={{ value: 5.4, positive: false }}
          testId="stat-ai-credits"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-lg">Revenue Overview</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div>
                <p className="text-3xl font-heading font-bold">৳{(dashboardStats.monthlyRevenue / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+18.2%</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(259, 58%, 64%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(259, 58%, 64%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                  <XAxis dataKey="month" stroke="hsl(0, 0%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(0, 0%, 45%)" fontSize={12} tickFormatter={(value) => `৳${value/1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 10%)',
                      border: '1px solid hsl(0, 0%, 20%)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(259, 58%, 64%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-add-user">
              <Plus className="h-4 w-4" />
              Add New User
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-create-plan">
              <CreditCard className="h-4 w-4" />
              Create Subscription Plan
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-view-reports">
              <FileText className="h-4 w-4" />
              Generate Reports
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" data-testid="button-sync-data">
              <RefreshCw className="h-4 w-4" />
              Sync Bkash Payments
            </Button>
            <Button className="w-full justify-start gap-3 bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-broadcast">
              <Activity className="h-4 w-4" />
              Send Broadcast
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary" data-testid="button-view-all-activity">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activityIcons[activity.icon] || Activity;
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors" data-testid={`activity-${activity.id}`}>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'payment' && `Payment received: ৳${activity.amount}`}
                        {activity.type === 'user_signup' && 'New user registered'}
                        {activity.type === 'slide_generated' && 'Generated new slides'}
                        {activity.type === 'assessment' && `Presentation score: ${activity.score}%`}
                        {activity.type === 'subscription' && `Upgraded to ${activity.plan}`}
                        {activity.type === 'ocr_process' && `Processed ${activity.pages} pages`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-lg">System Health</CardTitle>
            <StatusBadge status="operational" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(systemHealth).map(([service, status]) => {
                const icons: Record<string, any> = {
                  apiStatus: Server,
                  ocrService: Scan,
                  speechService: Mic,
                  database: Database,
                  storage: HardDrive,
                  bkashGateway: Wallet,
                };
                const Icon = icons[service] || Server;
                const labels: Record<string, string> = {
                  apiStatus: 'API Status',
                  ocrService: 'OCR Service',
                  speechService: 'Speech Recognition',
                  database: 'Database',
                  storage: 'Storage',
                  bkashGateway: 'Bkash Gateway',
                };

                return (
                  <div key={service} className="flex items-center justify-between p-3 rounded-lg bg-muted/30" data-testid={`health-${service}`}>
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{labels[service]}</span>
                    </div>
                    <StatusBadge status={status as any} />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">Storage Warning</span>
              </div>
              <Progress value={85} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">85% of storage capacity used (85GB / 100GB)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}