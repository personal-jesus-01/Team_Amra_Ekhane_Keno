import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CreditCard,
  Users,
  TrendingUp,
  Plus,
  Edit,
  Check,
  Crown,
  Zap,
  Building2,
} from 'lucide-react';
import { subscriptionPlans, users } from '@/lib/mockData';

const planIcons: Record<string, any> = {
  Basic: Zap,
  Pro: Crown,
  Enterprise: Building2,
};

export default function Subscriptions() {
  const [editingPlan, setEditingPlan] = useState<typeof subscriptionPlans[0] | null>(null);

  const totalSubscribers = subscriptionPlans.reduce((acc, plan) => acc + plan.active, 0);
  const monthlyRevenue = subscriptionPlans.reduce((acc, plan) => acc + (plan.price * plan.active), 0);

  return (
    <AdminLayout title="Subscription Management" subtitle="Manage subscription plans and active subscriptions">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          icon={<Users className="h-6 w-6" />}
          change={{ value: 8.5, positive: true }}
          testId="stat-total-subscribers"
        />
        <StatCard
          title="Monthly Revenue"
          value={`৳${(monthlyRevenue / 1000).toFixed(0)}K`}
          icon={<TrendingUp className="h-6 w-6" />}
          change={{ value: 12.3, positive: true }}
          testId="stat-monthly-revenue"
        />
        <StatCard
          title="Active Plans"
          value={subscriptionPlans.length}
          icon={<CreditCard className="h-6 w-6" />}
          testId="stat-active-plans"
        />
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="plans" data-testid="tab-plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">Active Subscriptions</TabsTrigger>
          </TabsList>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-plan">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Subscription Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plan Name</Label>
                    <Input placeholder="e.g., Premium" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Price (BDT)</Label>
                    <Input type="number" placeholder="499" className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>AI Credits / Month</Label>
                    <Input type="number" placeholder="500" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>OCR Pages / Month</Label>
                    <Input type="number" placeholder="200" className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Storage Limit</Label>
                  <Input placeholder="e.g., 10GB" className="mt-1.5" />
                </div>
                <div>
                  <Label>Features (one per line)</Label>
                  <Textarea placeholder="Advanced OCR&#10;Premium slides&#10;Priority support" className="mt-1.5" rows={4} />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90">Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => {
              const Icon = planIcons[plan.name] || CreditCard;
              return (
                <Card key={plan.id} className="border-border/50 relative overflow-hidden group hover:border-primary/50 transition-colors" data-testid={`plan-card-${plan.id}`}>
                  {plan.name === 'Pro' && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                      Popular
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${
                        plan.name === 'Enterprise' ? 'bg-purple-500/10 text-purple-400' :
                        plan.name === 'Pro' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.active.toLocaleString()} active users</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-heading font-bold">৳{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AI Credits</span>
                        <span className="font-medium">{plan.aiCredits.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">OCR Pages</span>
                        <span className="font-medium">{plan.ocrPages.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">{plan.storage}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" data-testid={`button-edit-plan-${plan.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.filter(u => u.status === 'active').map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors" data-testid={`subscription-${user.id}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        user.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400' :
                        user.plan === 'Pro' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {user.plan === 'Enterprise' ? <Building2 className="h-5 w-5" /> :
                         user.plan === 'Pro' ? <Crown className="h-5 w-5" /> :
                         <Zap className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={
                        user.plan === 'Enterprise' ? 'border-purple-500/30 text-purple-400' :
                        user.plan === 'Pro' ? 'border-primary/30 text-primary' :
                        ''
                      }>
                        {user.plan}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">Since {user.joinDate}</p>
                        <p className="text-xs text-muted-foreground">Next billing: Feb 15</p>
                      </div>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}