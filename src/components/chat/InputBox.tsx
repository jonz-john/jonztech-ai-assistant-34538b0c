import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, X, Camera, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractTextFromPDF, downloadPDF } from "@/utils/pdfUtils";
import { toast } from "sonner";

interface InputBoxProps {
  onSend: (message: string, image?: string, documentText?: string) => void;
  disabled?: boolean;
  onGeneratePDF?: (content: string) => void;
}

export const InputBox = ({ onSend, disabled, onGeneratePDF }: InputBoxProps) => {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || image || documentText) {
      onSend(message.trim(), image || undefined, documentText || undefined);
      setMessage("");
      setImage(null);
      setDocumentText(null);
      setDocumentName(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (file.type === "application/pdf") {
      try {
        toast.info("Reading PDF document...");
        const text = await extractTextFromPDF(file);
        setDocumentText(text);
        setDocumentName(file.name);
        toast.success("PDF loaded successfully!");
      } catch (error) {
        toast.error("Failed to read PDF");
      }
    } else if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentText(reader.result as string);
        setDocumentName(file.name);
        toast.success("Document loaded!");
      };
      reader.readAsText(file);
    } else {
      toast.error("Unsupported document format. Please use PDF or TXT files.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDocumentUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        handleImageUpload(file);
      } else if (file.type === "application/pdf" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        handleDocumentUpload(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleGeneratePDF = () => {
    if (onGeneratePDF) {
      onGeneratePDF(message || "Generated from JonzTech AI conversation");
    }
  };

  return (
    <div
      className={cn(
        "glass-strong rounded-2xl p-3 sm:p-4 transition-all duration-200 relative",
        isDragging && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {image && (
        <div className="relative inline-block mb-3 mr-2">
          <img
            src={image}
            alt="Preview"
            className="max-h-24 sm:max-h-32 rounded-lg object-cover"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {documentName && (
        <div className="relative inline-flex items-center gap-2 mb-3 px-3 py-2 bg-secondary rounded-lg">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm truncate max-w-[150px] sm:max-w-[200px]">{documentName}</span>
          <button
            onClick={() => {
              setDocumentText(null);
              setDocumentName(null);
            }}
            className="ml-1 text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Textarea first for better mobile layout */}
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask JonzTech AI anything..."
        className="min-h-[60px] sm:min-h-[80px] max-h-40 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-sm mb-3"
        disabled={disabled}
      />

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-0.5 sm:gap-1 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={docInputRef}
            onChange={handleDocChange}
            accept=".pdf,.txt,.md"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
              }
            }}
            title="Take photo"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
            onClick={() => docInputRef.current?.click()}
            title="Upload document"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
            onClick={handleGeneratePDF}
            title="Generate PDF from response"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !image && !documentText)}
          size="icon"
          className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl btn-primary flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 rounded-2xl flex items-center justify-center pointer-events-none">
          <p className="text-primary font-medium">Drop image or document here</p>
        </div>
      )}
    </div>
  );
};
