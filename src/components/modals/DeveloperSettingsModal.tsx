import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface DeveloperSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isUnlocked: boolean;
  onUnlock: (password: string) => boolean;
  customKnowledge: string[];
  onAddKnowledge: (knowledge: string) => void;
  onRemoveKnowledge: (index: number) => void;
}

export const DeveloperSettingsModal = ({
  open,
  onOpenChange,
  isUnlocked,
  onUnlock,
  customKnowledge,
  onAddKnowledge,
  onRemoveKnowledge,
}: DeveloperSettingsModalProps) => {
  const [password, setPassword] = useState("");
  const [newKnowledge, setNewKnowledge] = useState("");

  const handleUnlock = () => {
    if (onUnlock(password)) {
      toast.success("Developer mode activated! Welcome, John Ominde.");
      setPassword("");
    } else {
      toast.error("Invalid password");
    }
  };

  const handleAddKnowledge = () => {
    if (newKnowledge.trim()) {
      onAddKnowledge(newKnowledge.trim());
      setNewKnowledge("");
      toast.success("Knowledge added to AI memory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUnlocked ? (
              <Unlock className="w-5 h-5 text-primary" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
            Developer Settings
          </DialogTitle>
          <DialogDescription>
            {isUnlocked
              ? "Developer mode active. You can now add custom knowledge to the AI."
              : "Enter your developer password to access advanced settings."}
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password">Developer Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
            </div>
            <Button onClick={handleUnlock} className="w-full btn-primary">
              Unlock Developer Mode
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                Welcome back, CEO John Ominde! Developer mode is active.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Add Knowledge to AI Memory</Label>
              <Textarea
                value={newKnowledge}
                onChange={(e) => setNewKnowledge(e.target.value)}
                placeholder="Enter information to add to the AI's knowledge base..."
                className="min-h-[100px]"
              />
              <Button onClick={handleAddKnowledge} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add to Memory
              </Button>
            </div>

            {customKnowledge.length > 0 && (
              <div className="space-y-2">
                <Label>Custom Knowledge Base</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customKnowledge.map((knowledge, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-secondary rounded-lg text-sm"
                    >
                      <p className="flex-1 line-clamp-2">{knowledge}</p>
                      <button
                        onClick={() => onRemoveKnowledge(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
