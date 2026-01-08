import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  HeadphonesIcon,
  MessageSquare,
  Clock,
  CheckCircle,
  Filter,
  Eye,
  Send,
  Megaphone,
  Users,
  AlertCircle,
} from 'lucide-react';
import { supportTickets } from '@/lib/mockData';

export default function Support() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTickets = supportTickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const openCount = supportTickets.filter(t => t.status === 'open').length;
  const inProgressCount = supportTickets.filter(t => t.status === 'in_progress').length;

  const columns = [
    {
      key: 'id',
      header: 'Ticket ID',
      render: (t: typeof supportTickets[0]) => (
        <span className="font-mono text-sm">{t.id}</span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (t: typeof supportTickets[0]) => (
        <span className="font-medium text-sm">{t.user}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (t: typeof supportTickets[0]) => (
        <span className="text-sm">{t.subject}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t: typeof supportTickets[0]) => <StatusBadge status={t.priority as any} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: typeof supportTickets[0]) => <StatusBadge status={t.status as any} />,
    },
    {
      key: 'lastUpdate',
      header: 'Last Update',
      render: (t: typeof supportTickets[0]) => (
        <span className="text-sm text-muted-foreground">{t.lastUpdate}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (t: typeof supportTickets[0]) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-${t.id}`}>
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">{t.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">Ticket ID</p>
                  <p className="font-mono font-medium mt-1">{t.id}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">Priority</p>
                  <div className="mt-1"><StatusBadge status={t.priority as any} /></div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">Status</p>
                  <div className="mt-1"><StatusBadge status={t.status as any} /></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{t.user}</span>
                  <span className="text-xs text-muted-foreground">· {t.created}</span>
                </div>
                <p className="text-sm">
                  I'm having trouble with the OCR feature. When I upload documents with Bangla text, the system is not recognizing the characters correctly. Can you please help resolve this issue?
                </p>
              </div>
              <div>
                <Label>Reply</Label>
                <Textarea placeholder="Type your response..." className="mt-1.5" rows={4} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
                <Select defaultValue={t.status}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <AdminLayout title="Support & Communication" subtitle="Manage support tickets and announcements">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Open Tickets"
          value={openCount.toString()}
          icon={<MessageSquare className="h-6 w-6" />}
          testId="stat-open-tickets"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount.toString()}
          icon={<Clock className="h-6 w-6" />}
          testId="stat-in-progress"
        />
        <StatCard
          title="Resolved Today"
          value="8"
          icon={<CheckCircle className="h-6 w-6" />}
          testId="stat-resolved"
        />
        <StatCard
          title="Avg Response Time"
          value="2.4h"
          icon={<HeadphonesIcon className="h-6 w-6" />}
          testId="stat-response-time"
        />
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tickets" data-testid="tab-tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements">Announcements</TabsTrigger>
          <TabsTrigger value="broadcast" data-testid="tab-broadcast">Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32" data-testid="filter-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            data={filteredTickets}
            columns={columns}
            searchPlaceholder="Search tickets..."
            testIdPrefix="tickets"
          />
        </TabsContent>

        <TabsContent value="announcements">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">System Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">New Feature: Bangla Speech Recognition</span>
                  <span className="text-xs text-muted-foreground">Jan 5, 2025</span>
                </div>
                <p className="text-sm text-muted-foreground">We've launched enhanced Bangla speech recognition for presentation assessments.</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Scheduled Maintenance</span>
                  <span className="text-xs text-muted-foreground">Jan 10, 2025</span>
                </div>
                <p className="text-sm text-muted-foreground">The platform will be under maintenance from 2 AM to 4 AM BST.</p>
              </div>
              <Button className="w-full" variant="outline" data-testid="button-new-announcement">
                <Megaphone className="h-4 w-4 mr-2" />
                Create New Announcement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Send Broadcast Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target Audience</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="pro">Pro Subscribers</SelectItem>
                    <SelectItem value="enterprise">Enterprise Subscribers</SelectItem>
                    <SelectItem value="inactive">Inactive Users (30+ days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input placeholder="Notification subject" className="mt-1.5" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea placeholder="Write your message..." className="mt-1.5" rows={6} />
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Estimated Recipients</p>
                  <p className="text-xs text-muted-foreground">12,847 users will receive this notification</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90" data-testid="button-send-broadcast">
                  <Send className="h-4 w-4 mr-2" />
                  Send Broadcast
                </Button>
                <Button variant="outline">Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}