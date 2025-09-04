import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageSquare, Calendar, User, LogOut, BrainCircuit } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { conversations, loading, createConversation } = useConversations();
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('general');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return;
    
    const conversationId = await createConversation(newConversationTitle, selectedDomain);
    if (conversationId) {
      toast({ title: "Interview session created!", description: "Ready to start practicing." });
      navigate(`/chat/${conversationId}`);
    } else {
      toast({ title: "Failed to create session", description: "Please try again.", variant: "destructive" });
    }
    setNewConversationTitle('');
    setSelectedDomain('general');
    setIsCreateDialogOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">PrepSmart</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-3xl font-bold">
              Welcome back, {user?.name || 'there'}! 👋
            </h2>
            <p className="text-muted-foreground text-lg">
              Ready to practice and perfect your interview skills?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-elegant transition-smooth transform hover:scale-[1.02] bg-gradient-glass backdrop-blur-sm border-white/20">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>New Interview Session</CardTitle>
                    <CardDescription>
                      Start a fresh practice session
                    </CardDescription>
                  </CardHeader>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Interview Session</DialogTitle>
                  <DialogDescription>
                    Give your practice session a descriptive title to help you track your progress.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-title">Session Title</Label>
                    <Input
                      id="session-title"
                      placeholder="e.g., Software Engineer - Technical Round"
                      value={newConversationTitle}
                      onChange={(e) => setNewConversationTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateConversation()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain-select">Interview Domain</Label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger id="domain-select">
                        <SelectValue placeholder="Select interview domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Technology & Engineering */}
                        <SelectItem value="backend">Backend Development</SelectItem>
                        <SelectItem value="frontend">Frontend Development</SelectItem>
                        <SelectItem value="fullstack">Full Stack Development</SelectItem>
                        <SelectItem value="mobile">Mobile Development</SelectItem>
                        <SelectItem value="devops">DevOps Engineering</SelectItem>
                        <SelectItem value="data">Data Science/Engineering</SelectItem>
                        <SelectItem value="ml">Machine Learning</SelectItem>
                        <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                        <SelectItem value="qa">Quality Assurance</SelectItem>
                        
                        {/* Business & Management */}
                        <SelectItem value="product">Product Management</SelectItem>
                        <SelectItem value="projectmanagement">Project Management</SelectItem>
                        <SelectItem value="consulting">Management Consulting</SelectItem>
                        <SelectItem value="business">Business Analysis</SelectItem>
                        <SelectItem value="strategy">Business Strategy</SelectItem>
                        
                        {/* Design & Creative */}
                        <SelectItem value="design">UI/UX Design</SelectItem>
                        <SelectItem value="graphic">Graphic Design</SelectItem>
                        <SelectItem value="creative">Creative Director</SelectItem>
                        
                        {/* Sales & Marketing */}
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="marketing">Digital Marketing</SelectItem>
                        <SelectItem value="content">Content Marketing</SelectItem>
                        <SelectItem value="social">Social Media Marketing</SelectItem>
                        
                        {/* Finance & Operations */}
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="accounting">Accounting</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="supply">Supply Chain</SelectItem>
                        
                        {/* Healthcare & Science */}
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="nursing">Nursing</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="biotechnology">Biotechnology</SelectItem>
                        
                        {/* Education & HR */}
                        <SelectItem value="education">Education/Teaching</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="training">Training & Development</SelectItem>
                        
                        {/* Legal & Compliance */}
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        
                        {/* Customer Service */}
                        <SelectItem value="customer">Customer Service</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        
                        {/* General */}
                        <SelectItem value="general">General Interview</SelectItem>
                        <SelectItem value="leadership">Leadership Position</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="entry">Entry Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="gradient" onClick={handleCreateConversation}>
                      Start Session
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="bg-gradient-glass backdrop-blur-sm border-white/20">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{conversations.length}</CardTitle>
                <CardDescription>Total Sessions</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-glass backdrop-blur-sm border-white/20">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>
                  {conversations.filter(c => {
                    const today = new Date().toDateString();
                    return new Date(c.created_at).toDateString() === today;
                  }).length}
                </CardTitle>
                <CardDescription>Sessions Today</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Sessions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Recent Sessions</h3>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <Card className="text-center py-12 bg-gradient-glass backdrop-blur-sm border-white/20">
                <CardContent>
                  <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No sessions yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Create your first interview practice session to get started!
                  </p>
                  <Button variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className="cursor-pointer hover:shadow-elegant transition-smooth transform hover:scale-[1.02] bg-gradient-glass backdrop-blur-sm border-white/20"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="truncate">{conversation.title}</CardTitle>
                      <CardDescription>
                        Created {new Date(conversation.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{conversation.message_count || 0} messages</span>
                        <span>Continue →</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;