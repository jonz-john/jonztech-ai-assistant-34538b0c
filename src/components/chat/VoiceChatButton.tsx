import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import aiAvatar from '@/assets/ai-avatar.jpeg';

interface VoiceChatButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
}

export const VoiceChatButton = ({
  isListening,
  isSpeaking,
  availableVoices,
  currentVoice,
  rate,
  pitch,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onVoiceChange,
  onRateChange,
  onPitchChange,
}: VoiceChatButtonProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Group voices by language
  const groupedVoices = availableVoices.reduce((acc, voice) => {
    const lang = voice.lang.split('-')[0];
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  return (
    <div className="flex items-center gap-1">
      {/* AI Avatar - shown when speaking */}
      {isSpeaking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <img
                src={aiAvatar}
                alt="JonzTech AI"
                className="w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-primary shadow-2xl animate-pulse"
              />
              <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">JonzTech AI is speaking...</p>
              <p className="text-sm text-muted-foreground mt-1">Click to stop</p>
            </div>
            <Button
              onClick={onStopSpeaking}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <VolumeX className="w-5 h-5" />
              Stop Speaking
            </Button>
          </div>
        </div>
      )}

      {/* Microphone Button */}
      <Button
        variant={isListening ? "destructive" : "ghost"}
        size="icon"
        className={cn(
          "h-8 w-8 sm:h-9 sm:w-9 transition-all",
          isListening && "animate-pulse ring-2 ring-destructive ring-offset-2"
        )}
        onClick={isListening ? onStopListening : onStartListening}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </Button>

      {/* Speaking indicator */}
      {isSpeaking && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 text-primary animate-pulse"
          onClick={onStopSpeaking}
          title="Stop speaking"
        >
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      )}

      {/* Voice Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
            title="Voice settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Voice Selection */}
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select
                value={currentVoice?.name || ''}
                onValueChange={(name) => {
                  const voice = availableVoices.find(v => v.name === name);
                  if (voice) onVoiceChange(voice);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.entries(groupedVoices).map(([lang, voices]) => (
                    <div key={lang}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {lang}
                      </div>
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Speed</Label>
                <span className="text-sm text-muted-foreground">{rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[rate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([value]) => onRateChange(value)}
              />
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-muted-foreground">{pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[pitch]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([value]) => onPitchChange(value)}
              />
            </div>

            {/* Preview Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const synth = window.speechSynthesis;
                synth.cancel();
                const utterance = new SpeechSynthesisUtterance("Hello! I'm JonzTech AI. How can I help you today?");
                if (currentVoice) utterance.voice = currentVoice;
                utterance.rate = rate;
                utterance.pitch = pitch;
                synth.speak(utterance);
              }}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Preview Voice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
