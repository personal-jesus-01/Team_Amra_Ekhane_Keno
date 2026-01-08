import { useParams, Link } from 'wouter';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Ban,
  Trash2,
  Mail,
  Calendar,
  Presentation,
  Brain,
  CreditCard,
  Clock,
  Download,
} from 'lucide-react';
import { users, payments, slides } from '@/lib/mockData';

export default function UserDetails() {
  const { id } = useParams();
  const user = users.find(u => u.id === Number(id)) || users[0];
  const userPayments = payments.filter(p => p.user === user.name);
  const userSlides = slides.filter(s => s.user === user.name);

  return (
    <AdminLayout title="User Details" subtitle={user.name}>
      <div className="mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Avatar className="h-24 w-24 mx-auto border-4 border-primary mb-4">
                <AvatarFallback className="bg-primary/20 text-primary font-heading text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-heading text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="mt-3">
                <StatusBadge status={user.status as any} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Plan:</span>
                <Badge variant="outline" className="ml-auto">{user.plan}</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="ml-auto">{user.joinDate}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Active:</span>
                <span className="ml-auto">{user.lastActive}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" data-testid="button-edit-user">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" className="text-yellow-500 border-yellow-500/30" data-testid="button-suspend-user">
                <Ban className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="text-destructive border-destructive/30" data-testid="button-delete-user">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Slides"
              value={user.slides}
              icon={<Presentation className="h-5 w-5" />}
              testId="stat-user-slides"
            />
            <StatCard
              title="AI Credits Used"
              value="2,340"
              icon={<Brain className="h-5 w-5" />}
              testId="stat-user-credits"
            />
            <StatCard
              title="Total Spent"
              value="৳4,796"
              icon={<CreditCard className="h-5 w-5" />}
              testId="stat-user-spent"
            />
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Plan</p>
                  <p className="font-heading font-bold mt-1">{user.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Billing Cycle</p>
                  <p className="font-medium mt-1">Monthly</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Billing</p>
                  <p className="font-medium mt-1">Feb 15, 2025</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Credits Left</p>
                  <p className="font-heading font-bold mt-1 text-primary">160 / 500</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="slides" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="slides" data-testid="tab-slides">Presentations</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payment History</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="slides">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Presentations</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userSlides.length > 0 ? userSlides.map((slide) => (
                  <div key={slide.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30" data-testid={`slide-${slide.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Presentation className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{slide.title}</p>
                        <p className="text-xs text-muted-foreground">{slide.slides} slides · {slide.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-heading">{slide.quality}%</p>
                        <p className="text-xs text-muted-foreground">Quality</p>
                      </div>
                      <StatusBadge status={slide.status as any} />
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">No presentations found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPayments.length > 0 ? userPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30" data-testid={`payment-${payment.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <CreditCard className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.plan} Plan</p>
                        <p className="text-xs text-muted-foreground">{payment.date} · {payment.bkashId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-heading font-bold">৳{payment.amount}</span>
                      <StatusBadge status={payment.status as any} />
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">No payments found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Presentation className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Generated new presentation</p>
                    <p className="text-xs text-muted-foreground">Q4 Business Review · 24 slides</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Used AI credits</p>
                    <p className="text-xs text-muted-foreground">OCR processing · 12 pages</p>
                  </div>
                  <span className="text-xs text-muted-foreground">5 hours ago</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Subscription renewed</p>
                    <p className="text-xs text-muted-foreground">Pro Plan · ৳799</p>
                  </div>
                  <span className="text-xs text-muted-foreground">3 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}