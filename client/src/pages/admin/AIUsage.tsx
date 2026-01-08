import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Scan,
  Presentation,
  Mic,
  TrendingUp,
  Download,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { aiUsageData } from '@/lib/mockData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['hsl(259, 58%, 64%)', 'hsl(173, 58%, 45%)', 'hsl(197, 71%, 55%)', 'hsl(43, 96%, 58%)'];

export default function AIUsage() {
  const usagePercentage = (aiUsageData.usedCredits / aiUsageData.totalCredits) * 100;

  const pieData = [
    { name: 'OCR Processing', value: aiUsageData.ocrProcessed, color: COLORS[0] },
    { name: 'Slide Generation', value: aiUsageData.slidesGenerated, color: COLORS[1] },
    { name: 'Speech (English)', value: aiUsageData.speechEnglish, color: COLORS[2] },
    { name: 'Speech (Bangla)', value: aiUsageData.speechBangla, color: COLORS[3] },
  ];

  return (
    <AdminLayout title="AI Usage & Analytics" subtitle="Monitor AI feature consumption and costs">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Credits Used"
          value={(aiUsageData.usedCredits / 1000).toFixed(0) + 'K'}
          icon={<Brain className="h-6 w-6" />}
          change={{ value: 8.3, positive: false }}
          testId="stat-credits-used"
        />
        <StatCard
          title="OCR Processed"
          value={aiUsageData.ocrProcessed.toLocaleString()}
          icon={<Scan className="h-6 w-6" />}
          change={{ value: 12.5, positive: true }}
          testId="stat-ocr-processed"
        />
        <StatCard
          title="Slides Generated"
          value={aiUsageData.slidesGenerated.toLocaleString()}
          icon={<Presentation className="h-6 w-6" />}
          change={{ value: 18.2, positive: true }}
          testId="stat-slides-generated"
        />
        <StatCard
          title="Speech Analysis"
          value={(aiUsageData.speechEnglish + aiUsageData.speechBangla).toLocaleString()}
          icon={<Mic className="h-6 w-6" />}
          change={{ value: 5.7, positive: true }}
          testId="stat-speech-analysis"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Usage Over Time</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aiUsageData.daily}>
                  <defs>
                    <linearGradient id="colorOcr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSlide" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                  <XAxis dataKey="date" stroke="hsl(0, 0%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(0, 0%, 45%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 10%)',
                      border: '1px solid hsl(0, 0%, 20%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="ocr" stroke={COLORS[0]} strokeWidth={2} fillOpacity={1} fill="url(#colorOcr)" name="OCR" />
                  <Area type="monotone" dataKey="slideGen" stroke={COLORS[1]} strokeWidth={2} fillOpacity={1} fill="url(#colorSlide)" name="Slides" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Feature Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 10%)',
                      border: '1px solid hsl(0, 0%, 20%)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Credits Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Monthly Quota</span>
                  <span className="text-sm font-medium">{usagePercentage.toFixed(1)}% used</span>
                </div>
                <Progress value={usagePercentage} className="h-3" />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">{(aiUsageData.usedCredits / 1000).toFixed(0)}K used</span>
                  <span className="text-muted-foreground">{(aiUsageData.totalCredits / 1000).toFixed(0)}K total</span>
                </div>
              </div>

              {usagePercentage > 80 && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-500">High Usage Warning</p>
                    <p className="text-sm text-muted-foreground mt-1">Consider upgrading AI capacity or setting usage limits.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Scan className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">OCR per page</span>
                  </div>
                  <span className="font-heading text-sm">2 credits</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Presentation className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Slide generation</span>
                  </div>
                  <span className="font-heading text-sm">5 credits</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Speech analysis (min)</span>
                  </div>
                  <span className="font-heading text-sm">3 credits</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Speech Recognition Stats</CardTitle>
            <Tabs defaultValue="weekly" className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs h-6 px-2">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs h-6 px-2">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiUsageData.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                  <XAxis dataKey="date" stroke="hsl(0, 0%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(0, 0%, 45%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 10%)',
                      border: '1px solid hsl(0, 0%, 20%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="speechEn" fill={COLORS[2]} name="English" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="speechBn" fill={COLORS[3]} name="Bangla" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }} />
                <span className="text-sm">English</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[3] }} />
                <span className="text-sm">Bangla</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}