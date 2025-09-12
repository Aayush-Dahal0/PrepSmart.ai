import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import { useConversations } from '@/hooks/useApi';

const ProgressCard = () => {
  const { conversations } = useConversations();

  // Calculate statistics
  const totalSessions = conversations.length;
  
  const today = new Date();
  const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const sessionsThisWeek = conversations.filter(conv => {
    const convDate = new Date(conv.created_at);
    return !isNaN(convDate.getTime()) && convDate >= week;
  }).length;
  
  const sessionsThisMonth = conversations.filter(conv => {
    const convDate = new Date(conv.created_at);
    return !isNaN(convDate.getTime()) && convDate >= month;
  }).length;

  const weeklyProgress = Math.min((sessionsThisWeek / 3) * 100, 100); // Goal: 3 sessions per week
  const monthlyProgress = Math.min((sessionsThisMonth / 10) * 100, 100); // Goal: 10 sessions per month

  // Analyze domains
  const domainStats = conversations.reduce((acc, conv) => {
    const title = conv.title.toLowerCase();
    let domain = 'General';
    
    if (title.includes('backend') || title.includes('api')) domain = 'Backend';
    else if (title.includes('frontend') || title.includes('react')) domain = 'Frontend';
    else if (title.includes('data') || title.includes('ml')) domain = 'Data/ML';
    else if (title.includes('hr') || title.includes('behavioral')) domain = 'HR/Behavioral';
    else if (title.includes('system') || title.includes('design')) domain = 'System Design';
    
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDomain = Object.entries(domainStats).sort(([,a], [,b]) => b - a)[0];

  return (
    <Card className="bg-gradient-glass backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Your Progress
        </CardTitle>
        <CardDescription>
          Track your interview preparation journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              Total Sessions
            </div>
            <div className="text-2xl font-bold text-primary">{totalSessions}</div>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Weekly Goal (3 sessions)
            </span>
            <span className="font-medium">{sessionsThisWeek}/3</span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
        </div>

        {/* Monthly Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Monthly Goal (10 sessions)
            </span>
            <span className="font-medium">{sessionsThisMonth}/10</span>
          </div>
          <Progress value={monthlyProgress} className="h-2" />
        </div>

        {/* Top Domain */}
        {topDomain && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Most practiced:</span>
              <Badge variant="secondary" className="text-xs">
                {topDomain[0]} ({topDomain[1]} sessions)
              </Badge>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Recent achievements:</div>
          <div className="flex flex-wrap gap-1">
            {totalSessions >= 1 && (
              <Badge variant="outline" className="text-xs">🎯 First Session</Badge>
            )}
            {totalSessions >= 5 && (
              <Badge variant="outline" className="text-xs">⭐ 5 Sessions</Badge>
            )}
            {sessionsThisWeek >= 3 && (
              <Badge variant="outline" className="text-xs">🔥 Weekly Goal</Badge>
            )}
            {Object.keys(domainStats).length >= 3 && (
              <Badge variant="outline" className="text-xs">🎨 Multi-Domain</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
