import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSidebar } from "@/components/sidebar/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { InputBox } from "@/components/chat/InputBox";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Trash2, Menu, X, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { downloadPDF } from "@/utils/pdfUtils";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
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

  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

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
  } = useChat(user?.id);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSend = (message: string, image?: string, documentText?: string) => {
    // Check if user is trying to enable developer settings
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === "implement developer settings" || lowerMessage === "enable developer settings") {
      if (developerSettings.enabled) {
        sendMessage(message, image, documentText);
      } else {
        setPasswordDialogOpen(true);
        setPassword("");
        setPasswordError("");
      }
      return;
    }

    // Check if developer is adding custom knowledge
    if (developerSettings.enabled && lowerMessage.startsWith("remember:")) {
      const knowledge = message.slice(9).trim();
      if (knowledge) {
        addCustomKnowledge(knowledge);
        sendMessage(`I've added the following to my memory: "${knowledge}"`);
      }
      return;
    }

    sendMessage(message, image, documentText);
    setMobileMenuOpen(false);
  };

  const handlePasswordSubmit = async () => {
    setPasswordDialogOpen(false);
    const success = await unlockDeveloperMode();
    if (success) {
      sendMessage("Developer settings have been unlocked successfully. Welcome, John Ominde! You can now add knowledge to my memory by starting your message with 'remember:' followed by the information you want me to store.");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleGeneratePDF = (content: string) => {
    // Get the last assistant message or use provided content
    const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop();
    const pdfContent = lastAssistantMessage?.content || content;
    
    if (!pdfContent) {
      toast.error("No content to generate PDF from");
      return;
    }

    downloadPDF(pdfContent, `jonztech-ai-${Date.now()}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="JonzTech AI" className="w-16 h-16 rounded-xl animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border"
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
          isAuthenticated={!!user}
          onAuthClick={() => navigate("/auth")}
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
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="flex-shrink-0 h-12 sm:h-14 border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-6 glass-strong">
          <div className="flex items-center gap-2 sm:gap-3 ml-10 lg:ml-0">
            <img src={logo} alt="JonzTech AI" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover" />
            <div>
              <h1 className="font-semibold text-xs sm:text-sm">JonzTech AI</h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">by JonzTech AI Labs LLC</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-destructive h-8 px-2 sm:px-3"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear Chat</span>
              </Button>
            )}

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground h-8 px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth")}
                className="text-muted-foreground h-8 px-2 sm:px-3"
              >
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </header>

        {/* Auth notice for non-authenticated users */}
        {!user && (
          <div className="flex-shrink-0 bg-secondary/50 border-b border-border px-3 sm:px-4 py-1.5 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">
                Sign in
              </button>
              {" "}to save your chat history
            </p>
          </div>
        )}

        {/* Chat Window - takes remaining space */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Input Area - fixed at bottom */}
        <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4 border-t border-border bg-background/95 backdrop-blur-sm safe-area-bottom">
          <div className="max-w-3xl mx-auto">
            <InputBox 
              onSend={handleSend} 
              disabled={isLoading} 
              onGeneratePDF={handleGeneratePDF}
            />
            <p className="text-[9px] sm:text-[10px] text-center text-muted-foreground mt-1.5 sm:mt-2">
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