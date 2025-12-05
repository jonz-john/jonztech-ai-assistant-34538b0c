import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/sidebar/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { InputBox } from "@/components/chat/InputBox";
import { DeveloperSettingsModal } from "@/components/modals/DeveloperSettingsModal";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Trash2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    sendMessage(message, image);
    setMobileMenuOpen(false);
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
          onOpenSettings={() => setSettingsOpen(true)}
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
        <ChatWindow messages={messages} isLoading={isLoading} />

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

      {/* Developer Settings Modal */}
      <DeveloperSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isUnlocked={developerSettings.enabled}
        onUnlock={unlockDeveloperMode}
        customKnowledge={developerSettings.customKnowledge}
        onAddKnowledge={addCustomKnowledge}
        onRemoveKnowledge={removeCustomKnowledge}
      />
    </div>
  );
};

export default Index;
