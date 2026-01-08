import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Key,
  Mail,
  Bell,
  Shield,
  Database,
  Server,
  Scan,
  Mic,
  Wallet,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <AdminLayout title="System Configuration" subtitle="Manage platform settings and integrations">
      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="ai" data-testid="tab-ai">AI Settings</TabsTrigger>
          <TabsTrigger value="ocr" data-testid="tab-ocr">OCR</TabsTrigger>
          <TabsTrigger value="speech" data-testid="tab-speech">Speech</TabsTrigger>
          <TabsTrigger value="bkash" data-testid="tab-bkash">Bkash</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
          <TabsTrigger value="backup" data-testid="tab-backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Model Configuration
                </CardTitle>
                <CardDescription>Configure AI service endpoints and API keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>OpenAI API Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value="sk-••••••••••••••••••••••••••••••••"
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Model</Label>
                  <Select defaultValue="gpt-4">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Endpoint</Label>
                  <Input defaultValue="https://api.openai.com/v1" className="mt-1.5" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-medium text-sm">Rate Limiting</p>
                    <p className="text-xs text-muted-foreground">Limit API requests per user</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90" data-testid="button-save-ai">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  API Keys Management
                </CardTitle>
                <CardDescription>Manage external service API keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">OpenAI</p>
                    <p className="text-xs text-muted-foreground">Last updated 3 days ago</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Google Cloud Vision</p>
                    <p className="text-xs text-muted-foreground">OCR processing</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Azure Speech</p>
                    <p className="text-xs text-muted-foreground">Speech recognition</p>
                  </div>
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Expiring Soon
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" data-testid="button-add-api-key">
                  <Key className="h-4 w-4 mr-2" />
                  Add New API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ocr">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Scan className="h-5 w-5 text-primary" />
                OCR Settings
              </CardTitle>
              <CardDescription>Configure optical character recognition settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>OCR Provider</Label>
                  <Select defaultValue="google">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Cloud Vision</SelectItem>
                      <SelectItem value="azure">Azure Computer Vision</SelectItem>
                      <SelectItem value="tesseract">Tesseract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Language</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto Detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">Bangla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Bangla Script Support</p>
                    <p className="text-xs text-muted-foreground">Enable enhanced Bangla text recognition</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Handwriting Recognition</p>
                    <p className="text-xs text-muted-foreground">Enable handwritten text detection</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Table Detection</p>
                    <p className="text-xs text-muted-foreground">Automatically detect and extract tables</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-save-ocr">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speech">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Speech Recognition Settings
              </CardTitle>
              <CardDescription>Configure speech-to-text and analysis settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Speech Provider</Label>
                  <Select defaultValue="azure">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azure">Azure Speech Services</SelectItem>
                      <SelectItem value="google">Google Speech-to-Text</SelectItem>
                      <SelectItem value="aws">AWS Transcribe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bangla Speech Model</Label>
                  <Select defaultValue="enhanced">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="enhanced">Enhanced (Recommended)</SelectItem>
                      <SelectItem value="custom">Custom Trained</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Real-time Transcription</p>
                    <p className="text-xs text-muted-foreground">Enable live speech-to-text during presentations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Pace Analysis</p>
                    <p className="text-xs text-muted-foreground">Analyze speaking pace and rhythm</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Filler Word Detection</p>
                    <p className="text-xs text-muted-foreground">Detect "um", "uh" and other filler words</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-save-speech">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bkash">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Bkash Integration
              </CardTitle>
              <CardDescription>Configure Bkash payment gateway settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Merchant ID</Label>
                  <Input defaultValue="SLIDEBANAI123" className="mt-1.5" />
                </div>
                <div>
                  <Label>App Key</Label>
                  <Input type="password" defaultValue="••••••••••••" className="mt-1.5" />
                </div>
                <div>
                  <Label>App Secret</Label>
                  <Input type="password" defaultValue="••••••••••••" className="mt-1.5" />
                </div>
                <div>
                  <Label>Environment</Label>
                  <Select defaultValue="production">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Callback URL</Label>
                <Input defaultValue="https://slidebanai.io/api/bkash/callback" className="mt-1.5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto-verify Transactions</p>
                  <p className="text-xs text-muted-foreground">Automatically verify payments with Bkash API</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-save-bkash">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure email and SMS notification templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Welcome Email</p>
                    <p className="text-xs text-muted-foreground">Send welcome email on registration</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Payment Confirmation</p>
                    <p className="text-xs text-muted-foreground">Send receipt after successful payment</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Subscription Expiry</p>
                    <p className="text-xs text-muted-foreground">Notify before subscription expires</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Enable SMS for critical alerts</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <div>
                <Label>From Email</Label>
                <Input defaultValue="noreply@slidebanai.io" className="mt-1.5" />
              </div>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-save-notifications">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground mt-1">When enabled, users will see a maintenance page</p>
                  <div className="mt-3">
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Bangla Speech Recognition</p>
                    <p className="text-xs text-muted-foreground">Enable Bangla language support</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Advanced Analytics</p>
                    <p className="text-xs text-muted-foreground">Enable detailed presentation analytics</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Beta Features</p>
                    <p className="text-xs text-muted-foreground">Enable experimental features</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">API Access</p>
                    <p className="text-xs text-muted-foreground">Allow external API integrations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-save-features">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Backup & Restore
              </CardTitle>
              <CardDescription>Manage database backups and system restore points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">Last Backup</p>
                  <p className="font-medium mt-1">Jan 7, 2025 03:00 AM</p>
                  <p className="text-xs text-muted-foreground mt-1">Size: 2.4 GB</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">Next Scheduled</p>
                  <p className="font-medium mt-1">Jan 8, 2025 03:00 AM</p>
                  <p className="text-xs text-muted-foreground mt-1">Auto backup enabled</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" data-testid="button-backup-now">
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup Now
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-restore">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-download-backup">
                  <Server className="h-4 w-4 mr-2" />
                  Download Latest Backup
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto Backup</p>
                  <p className="text-xs text-muted-foreground">Automatically backup daily at 3 AM</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}