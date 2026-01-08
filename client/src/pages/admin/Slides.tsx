import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatCard } from '@/components/admin/StatCard';
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
import { Progress } from '@/components/ui/progress';
import {
  Presentation,
  FileText,
  Image,
  Filter,
  Eye,
  Trash2,
  Archive,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { slides, dashboardStats } from '@/lib/mockData';

export default function Slides() {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSlide, setSelectedSlide] = useState<typeof slides[0] | null>(null);

  const filteredSlides = slides.filter((slide) => {
    if (sourceFilter !== 'all' && slide.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && slide.status !== statusFilter) return false;
    return true;
  });

  const sourceIcons: Record<string, any> = {
    PDF: FileText,
    DOCX: FileText,
    Image: Image,
  };

  const columns = [
    {
      key: 'title',
      header: 'Presentation',
      render: (slide: typeof slides[0]) => {
        const Icon = sourceIcons[slide.source] || FileText;
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Presentation className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{slide.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{slide.source}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'user',
      header: 'Created By',
      render: (slide: typeof slides[0]) => (
        <span className="text-sm">{slide.user}</span>
      ),
    },
    {
      key: 'slides',
      header: 'Slides',
      render: (slide: typeof slides[0]) => (
        <span className="font-heading text-sm">{slide.slides}</span>
      ),
    },
    {
      key: 'quality',
      header: 'Quality Score',
      render: (slide: typeof slides[0]) => (
        <div className="flex items-center gap-2">
          <Progress value={slide.quality} className="w-16 h-2" />
          <span className={`font-heading text-sm ${
            slide.quality >= 90 ? 'text-emerald-400' :
            slide.quality >= 80 ? 'text-blue-400' :
            slide.quality >= 70 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {slide.quality}%
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (slide: typeof slides[0]) => <StatusBadge status={slide.status as any} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (slide: typeof slides[0]) => (
        <span className="text-sm text-muted-foreground">{slide.createdAt}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (slide: typeof slides[0]) => (
        <div className="flex items-center gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSlide(slide)} data-testid={`button-view-${slide.id}`}>
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading">{slide.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created By</p>
                    <p className="font-medium">{slide.user}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Source Type</p>
                    <p className="font-medium">{slide.source}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Slides</p>
                    <p className="font-heading font-bold text-xl">{slide.slides}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quality Score</p>
                    <p className="font-heading font-bold text-xl text-primary">{slide.quality}%</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Suggestions</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Good use of visual hierarchy in title slides</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Consider reducing text density on slides 5-8</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Add more visual elements to data-heavy slides</span>
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">Download Slides</Button>
                  <Button variant="outline">View Original</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid={`button-archive-${slide.id}`}>
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" data-testid={`button-delete-${slide.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Slides Management" subtitle="View and manage all generated presentations">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Slides"
          value={dashboardStats.slidesMonth.toLocaleString()}
          icon={<Presentation className="h-6 w-6" />}
          change={{ value: 15.2, positive: true }}
          testId="stat-total-slides"
        />
        <StatCard
          title="This Week"
          value={dashboardStats.slidesWeek.toLocaleString()}
          icon={<TrendingUp className="h-6 w-6" />}
          testId="stat-slides-week"
        />
        <StatCard
          title="Avg Quality"
          value="87%"
          icon={<CheckCircle className="h-6 w-6" />}
          testId="stat-avg-quality"
        />
        <StatCard
          title="Needs Review"
          value="12"
          icon={<AlertCircle className="h-6 w-6" />}
          testId="stat-needs-review"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-32" data-testid="filter-source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="DOCX">DOCX</SelectItem>
              <SelectItem value="Image">Image</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filteredSlides}
        columns={columns}
        searchPlaceholder="Search presentations..."
        testIdPrefix="slides"
      />
    </AdminLayout>
  );
}