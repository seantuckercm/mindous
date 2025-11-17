'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Key, 
  Bell, 
  CreditCard, 
  Shield, 
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Zap,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [name, setName] = useState(user?.fullName || 'John Doe');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || 'john@example.com');
  
  // API Keys state
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('sk-proj-••••••••••••••••');
  const [anthropicKey, setAnthropicKey] = useState('sk-ant-••••••••••••••••');
  const [abacusKey, setAbacusKey] = useState('s2_••••••••••••••••');
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskCompletions, setTaskCompletions] = useState(true);
  const [taskFailures, setTaskFailures] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [creditAlerts, setCreditAlerts] = useState(true);
  
  // Billing info (mock data)
  const billingInfo = {
    plan: 'Pro',
    billingCycle: 'Monthly',
    nextBilling: '2024-12-17',
    credits: 450,
    usedCredits: 250,
    cost: 29.99,
  };

  const handleCopyApiKey = () => {
    // Copy logic would go here
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    // Save profile logic would go here
    console.log('Saving profile:', { name, email });
  };

  const handleSaveApiKeys = () => {
    // Save API keys logic would go here
    console.log('Saving API keys');
  };

  const handleSaveNotifications = () => {
    // Save notification preferences logic would go here
    console.log('Saving notifications');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="text-2xl">
                    {name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                  <p className="text-xs text-muted-foreground">
                    This email will be used for all communications
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="userId">User ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="userId"
                      value={user?.id || 'user_abc123'}
                      disabled
                      className="bg-muted"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                      {apiKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Manage your API keys for LLM providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Keep your API keys secure</p>
                  <p className="text-blue-700 mt-1">
                    Never share your API keys publicly. They provide access to your accounts and can incur charges.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <Label htmlFor="openai">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai"
                        type={showApiKey ? 'text' : 'password'}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-proj-..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                      {apiKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for GPT-4 and other OpenAI models
                  </p>
                </div>

                {/* Anthropic API Key */}
                <div className="space-y-2">
                  <Label htmlFor="anthropic">Anthropic API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="anthropic"
                      type={showApiKey ? 'text' : 'password'}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for Claude models
                  </p>
                </div>

                {/* Abacus AI API Key */}
                <div className="space-y-2">
                  <Label htmlFor="abacus">Abacus AI API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="abacus"
                      type={showApiKey ? 'text' : 'password'}
                      value={abacusKey}
                      onChange={(e) => setAbacusKey(e.target.value)}
                      placeholder="s2_..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for Abacus AI platform integration
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">Test Connection</Button>
                <Button onClick={handleSaveApiKeys}>
                  Save API Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Task Completions</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks complete successfully
                    </p>
                  </div>
                  <Switch
                    checked={taskCompletions}
                    onCheckedChange={setTaskCompletions}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Task Failures</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks fail or encounter errors
                    </p>
                  </div>
                  <Switch
                    checked={taskFailures}
                    onCheckedChange={setTaskFailures}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summary of your task executions
                    </p>
                  </div>
                  <Switch
                    checked={weeklyReports}
                    onCheckedChange={setWeeklyReports}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Credit Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when credit balance is low
                    </p>
                  </div>
                  <Switch
                    checked={creditAlerts}
                    onCheckedChange={setCreditAlerts}
                    disabled={!emailNotifications}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{billingInfo.plan}</p>
                    <p className="text-sm text-muted-foreground">
                      {billingInfo.billingCycle} billing
                    </p>
                  </div>
                </div>
                <Badge className="text-lg px-4 py-2">
                  ${billingInfo.cost}/month
                </Badge>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Next Billing Date</p>
                    <p className="text-sm text-muted-foreground">{billingInfo.nextBilling}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Total Spent This Month</p>
                    <p className="text-sm text-muted-foreground">${billingInfo.cost}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Credit Usage</p>
                  <p className="text-sm text-muted-foreground">
                    {billingInfo.usedCredits} / {billingInfo.credits} credits used
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(billingInfo.usedCredits / billingInfo.credits) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {billingInfo.credits - billingInfo.usedCredits} credits remaining
                </p>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1">Upgrade Plan</Button>
                <Button variant="outline" className="flex-1">View Billing History</Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/25</p>
                  </div>
                </div>
                <Badge>Default</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
