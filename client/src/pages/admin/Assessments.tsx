import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Mic,
  Clock,
  TrendingUp,
  Users,
  Filter,
  Eye,
  Download,
  Play,
  Volume2,
  MessageSquare,
  Target,
} from 'lucide-react';
import { assessments } from '@/lib/mockData';

export default function Assessments() {
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<typeof assessments[0] | null>(null);

  const filteredAssessments = assessments.filter((a) => {
    if (languageFilter !== 'all' && a.language !== languageFilter) return false;
    return true;
  });

  const avgScore = Math.round(assessments.reduce((acc, a) => acc + a.score, 0) / assessments.length);

  const columns = [
    {
      key: 'user',
      header: 'Presenter',
      render: (a: typeof assessments[0]) => (
        <div>
          <p className="font-medium text-sm">{a.user}</p>
          <p className="text-xs text-muted-foreground">{a.title}</p>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (a: typeof assessments[0]) => (
        <div className="flex items-center gap-2">
          <Progress value={a.score} className="w-16 h-2" />
          <span className={`font-heading text-sm ${
            a.score >= 90 ? 'text-emerald-400' :
            a.score >= 80 ? 'text-blue-400' :
            a.score >= 70 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {a.score}%
          </span>
        </div>
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (a: typeof assessments[0]) => (
        <Badge variant="outline" className={a.language === 'Bangla' ? 'border-green-500/30 text-green-400' : ''}>
          {a.language}
        </Badge>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (a: typeof assessments[0]) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {a.duration}
        </div>
      ),
    },
    {
      key: 'pace',
      header: 'Pace',
      render: (a: typeof assessments[0]) => (
        <span className={`text-sm font-medium ${
          a.pace === 'Excellent' ? 'text-emerald-400' :
          a.pace === 'Good' ? 'text-blue-400' :
          'text-yellow-400'
        }`}>
          {a.pace}
        </span>
      ),
    },
    {
      key: 'clarity',
      header: 'Clarity',
      render: (a: typeof assessments[0]) => (
        <span className="font-heading text-sm">{a.clarity}%</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (a: typeof assessments[0]) => (
        <span className="text-sm text-muted-foreground">{a.date}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (a: typeof assessments[0]) => (
        <div className="flex items-center gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedAssessment(a)} data-testid={`button-view-${a.id}`}>
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading">{a.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Mic className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{a.user}</p>
                      <p className="text-sm text-muted-foreground">{a.date} · {a.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-heading font-bold text-primary">{a.score}%</p>
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <Volume2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-heading font-bold">{a.pace}</p>
                    <p className="text-xs text-muted-foreground">Pace</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <MessageSquare className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-heading font-bold">{a.clarity}%</p>
                    <p className="text-xs text-muted-foreground">Clarity</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-heading font-bold">{a.language}</p>
                    <p className="text-xs text-muted-foreground">Language</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Detailed Analysis</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Speech Clarity</span>
                        <span className="text-sm font-medium">{a.clarity}%</span>
                      </div>
                      <Progress value={a.clarity} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Content Alignment</span>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Engagement</span>
                        <span className="text-sm font-medium">82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Play Recording
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-download-${a.id}`}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Presentation Assessments" subtitle="Review and analyze presentation performance">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Assessments"
          value={assessments.length.toString()}
          icon={<Mic className="h-6 w-6" />}
          change={{ value: 23.5, positive: true }}
          testId="stat-total-assessments"
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          change={{ value: 5.2, positive: true }}
          testId="stat-avg-score"
        />
        <StatCard
          title="English Sessions"
          value={assessments.filter(a => a.language === 'English').length.toString()}
          icon={<MessageSquare className="h-6 w-6" />}
          testId="stat-english-sessions"
        />
        <StatCard
          title="Bangla Sessions"
          value={assessments.filter(a => a.language === 'Bangla').length.toString()}
          icon={<MessageSquare className="h-6 w-6" />}
          testId="stat-bangla-sessions"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-32" data-testid="filter-language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Bangla">Bangla</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filteredAssessments}
        columns={columns}
        searchPlaceholder="Search assessments..."
        testIdPrefix="assessments"
      />
    </AdminLayout>
  );
}