import { useState } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreHorizontal, Eye, Edit, Ban, Trash2, Filter } from 'lucide-react';
import { users } from '@/lib/mockData';

export default function Users() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const filteredUsers = users.filter((user) => {
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;
    if (planFilter !== 'all' && user.plan !== planFilter) return false;
    return true;
  });

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: typeof users[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-heading text-xs">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (user: typeof users[0]) => (
        <span className={`font-medium text-sm ${
          user.plan === 'Enterprise' ? 'text-purple-400' :
          user.plan === 'Pro' ? 'text-blue-400' : 'text-muted-foreground'
        }`}>
          {user.plan}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: typeof users[0]) => <StatusBadge status={user.status as any} />,
    },
    {
      key: 'slides',
      header: 'Slides',
      render: (user: typeof users[0]) => (
        <span className="font-heading text-sm">{user.slides}</span>
      ),
    },
    {
      key: 'joinDate',
      header: 'Joined',
      render: (user: typeof users[0]) => (
        <span className="text-sm text-muted-foreground">{user.joinDate}</span>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      render: (user: typeof users[0]) => (
        <span className="text-sm text-muted-foreground">{user.lastActive}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (user: typeof users[0]) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-actions-${user.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-yellow-500">
              <Ban className="h-4 w-4 mr-2" />
              {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout title="User Management" subtitle="Manage all platform users">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-32" data-testid="filter-plan">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search users..."
        testIdPrefix="users"
      />
    </AdminLayout>
  );
}