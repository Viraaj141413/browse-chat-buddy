import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Square, 
  Globe,
  Bot,
  User,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIInterfaceProps {
  userName: string;
  onLogout: () => void;
}

export const AIInterface = ({ userName, onLogout }: AIInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Welcome, ${userName}! I'm your AI browsing assistant. Tell me what you'd like me to do on the web, and I'll navigate and complete tasks while you watch. Try saying something like "Search for the latest iPhone reviews" or "Find flights to Paris"`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response and browsing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you want me to "${inputValue}". I'll start browsing now and complete this task. You can watch my progress in the browser window on the right.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsBrowsing(true);

      toast({
        title: "AI Browsing Started",
        description: "Watch the live browser as I complete your task",
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceRecording = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast({
        title: "Voice Recording",
        description: "ElevenLabs integration will be activated with your API key",
      });
    }
  };

  const toggleBrowsingPause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Browsing Resumed" : "Browsing Paused",
      description: isPaused ? "AI will continue the current task" : "AI actions paused, conversation continues",
    });
  };

  const stopBrowsing = () => {
    setIsBrowsing(false);
    setIsPaused(false);
    toast({
      title: "Browsing Stopped",
      description: "AI has stopped the current browsing task",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Chat Interface */}
      <div className="w-1/2 border-r border-border flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex justify-between items-center bg-card/50">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary animate-pulse-glow" />
            <h2 className="text-xl font-semibold">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {message.type === 'user' ? 
                      <User className="h-4 w-4 text-primary-foreground" /> : 
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    }
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border border-border'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Browsing Controls */}
          {isBrowsing && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBrowsingPause}
                className="gap-2"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"} Browsing
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={stopBrowsing}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell the AI what to browse or do..."
                className="pr-12 bg-muted/50"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoiceRecording}
                className={`absolute right-1 top-1 h-8 w-8 p-0 ${isListening ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Browser View */}
      <div className="w-1/2 flex flex-col">
        <div className="border-b border-border p-4 bg-card/50">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-semibold">Live Browser</h2>
            {isBrowsing && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-success">AI Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-muted/30 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Globe className="h-8 w-8 text-accent" />
                Live Browser View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {isBrowsing 
                  ? "AI is browsing... This will show the live browser session controlled by AI."
                  : "Give the AI a command to start browsing. You'll see the live browser session here."
                }
              </p>
              {!isBrowsing && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Try commands like:</p>
                  <ul className="text-xs space-y-1">
                    <li>• "Search for laptop reviews"</li>
                    <li>• "Find flights to Tokyo"</li>
                    <li>• "Check the weather forecast"</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};