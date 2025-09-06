import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversations } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, Search, Trash2, Edit3, ExternalLink, Filter } from 'lucide-react';
import RenameSessionDialog from '@/components/RenameSessionDialog';

interface SessionManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SessionManagementDialog: React.FC<SessionManagementDialogProps> = ({ open, onOpenChange }) => {
  const { conversations, loading, deleteConversation, refetch } = useConversations();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [renameSession, setRenameSession] = useState<{id: string, title: string} | null>(null);
  const [localConversations, setLocalConversations] = useState(conversations);

  // Update local conversations when prop changes
  React.useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const filteredConversations = localConversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const convDate = new Date(conv.created_at);
    if (isNaN(convDate.getTime())) {
      // If date is invalid, only show in 'all' filter
      return filter === 'all';
    }
    
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return convDate.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return convDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return convDate >= monthAgo;
      }
      default:
        return true;
    }
  });

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      const success = await deleteConversation(id);
      if (success) {
        toast({
          title: "Session deleted",
          description: "The interview session has been removed.",
        });
        refetch();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the session. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenSession = (id: string) => {
    onOpenChange(false);
    navigate(`/chat/${id}`);
  };

  const handleRename = (newTitle: string) => {
    if (renameSession) {
      setLocalConversations(prev => 
        prev.map(conv => 
          conv.id === renameSession.id 
            ? { ...conv, title: newTitle }
            : conv
        )
      );
      setRenameSession(null);
    }
  };

  const getDomainBadgeColor = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('backend') || lower.includes('api')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('frontend') || lower.includes('react')) return 'bg-green-100 text-green-800';
    if (lower.includes('data') || lower.includes('ml')) return 'bg-purple-100 text-purple-800';
    if (lower.includes('hr') || lower.includes('behavioral')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Manage Sessions
          </DialogTitle>
          <DialogDescription>
            View, search, and manage your interview practice sessions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'today', 'week', 'month'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </CardHeader>
                  </Card>
                ))
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No sessions match your search.' : 'No sessions found.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <Card key={conversation.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base truncate">{conversation.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {(() => {
                                const date = new Date(conversation.created_at);
                                if (isNaN(date.getTime())) {
                                  return 'Recent session';
                                }
                                return date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                });
                              })()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {conversation.message_count || 0} messages
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRenameSession({id: conversation.id, title: conversation.title})}
                            className="h-8 w-8 p-0"
                            title="Rename session"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSession(conversation.id)}
                            className="h-8 w-8 p-0"
                            title="Open session"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(conversation.id, conversation.title)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getDomainBadgeColor(conversation.title)}>
                          {conversation.title.split(' ')[0] || 'General'}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredConversations.length} of {localConversations.length} sessions
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        {/* Rename Dialog */}
        {renameSession && (
          <RenameSessionDialog
            open={!!renameSession}
            onOpenChange={(open) => !open && setRenameSession(null)}
            sessionId={renameSession.id}
            currentTitle={renameSession.title}
            onRename={handleRename}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SessionManagementDialog;