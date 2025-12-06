import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/sidebar/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { InputBox } from "@/components/chat/InputBox";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Trash2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Index = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    developerSettings,
    setCurrentSessionId,
    createSession,
    deleteSession,
    sendMessage,
    clearChat,
    unlockDeveloperMode,
    addCustomKnowledge,
    removeCustomKnowledge,
  } = useChat();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSend = (message: string, image?: string) => {
    // Check if user is trying to enable developer settings
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === "implement developer settings" || lowerMessage === "enable developer settings") {
      if (developerSettings.enabled) {
        sendMessage(message, image);
      } else {
        setPasswordDialogOpen(true);
        setPassword("");
        setPasswordError("");
      }
      return;
    }
    sendMessage(message, image);
    setMobileMenuOpen(false);
  };

  const handlePasswordSubmit = () => {
    const success = unlockDeveloperMode(password);
    if (success) {
      setPasswordDialogOpen(false);
      setPassword("");
      setPasswordError("");
      // Send a confirmation message to the chat
      sendMessage("Developer settings have been unlocked successfully.");
    } else {
      setPasswordError("Incorrect password. Access denied.");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:transform-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={createSession}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setMobileMenuOpen(false);
          }}
          onDeleteSession={deleteSession}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 glass-strong">
          <div className="flex items-center gap-3 ml-12 lg:ml-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">JT</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">JonzTech AI</h1>
              <p className="text-[10px] text-muted-foreground">by JonzTech AI Labs LLC</p>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          )}
        </header>

        {/* Chat Window */}
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Input Area */}
        <div className="p-4 lg:p-6 border-t border-border bg-background/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <InputBox onSend={handleSend} disabled={isLoading} />
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              JonzTech AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>

      {/* Developer Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Developer Authentication Required</DialogTitle>
            <DialogDescription>
              Enter the developer password to unlock developer settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter developer password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <Button onClick={handlePasswordSubmit} className="w-full btn-primary">
              Authenticate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
