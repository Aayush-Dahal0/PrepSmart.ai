import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useApi';

interface RenameSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  currentTitle: string;
  onRename: (newTitle: string) => void;
}

const RenameSessionDialog: React.FC<RenameSessionDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  currentTitle,
  onRename
}) => {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const { toast } = useToast();
  const { renameConversation } = useConversations();

  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Session title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await renameConversation(sessionId, newTitle.trim());
      
      if (success) {
        onRename(newTitle.trim());
        onOpenChange(false);
        toast({
          title: "Session Renamed",
          description: "Your session title has been updated successfully.",
        });
      } else {
        throw new Error("Rename failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Session</DialogTitle>
          <DialogDescription>
            Enter a new title for your interview practice session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-title">Session Title</Label>
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="Enter new session title..."
              autoFocus
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleRename}>
              Rename
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenameSessionDialog;