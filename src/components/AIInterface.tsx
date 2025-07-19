import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Pause, Play, Square, Send, LogOut, Monitor, AlertCircle, Globe, Bot, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

interface BrowserSession {
  steps: string[];
  currentStep: number;
  screenshotUrl: string;
  status: 'idle' | 'browsing' | 'paused' | 'waiting_confirmation';
  requiresConfirmation: boolean;
}

interface AIInterfaceProps {
  userName: string;
  onLogout: () => void;
}

export const AIInterface: React.FC<AIInterfaceProps> = ({ userName, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello ${userName}! I'm your AI browsing assistant powered by Gemini. Tell me what you'd like me to do - order food, book a ride, find products, or anything else. I'll browse the web live for you and you can take control anytime! You can even give me your passwords and I'll handle logins securely.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [browserSession, setBrowserSession] = useState<BrowserSession>({
    steps: [],
    currentStep: 0,
    screenshotUrl: 'https://via.placeholder.com/800x600/0f0f23/8b5cf6?text=AI+Browser+Ready+%0APowered+by+Gemini+%26+Live+Automation%0AType+a+command+to+start+browsing',
    status: 'idle',
    requiresConfirmation: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');

    try {
      // Call Gemini API to understand user intent
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: currentInput }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Start browser automation
      await startBrowserSession(currentInput);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please make sure Gemini API key is configured.",
        variant: "destructive"
      });
    }
  };

  const startBrowserSession = async (task: string) => {
    try {
      setBrowserSession(prev => ({ ...prev, status: 'browsing' }));
      
      // Determine action type based on task
      let action = 'general_browsing';
      if (task.toLowerCase().includes('order') || task.toLowerCase().includes('food') || task.toLowerCase().includes('latte') || task.toLowerCase().includes('coffee')) {
        action = 'order_food';
      } else if (task.toLowerCase().includes('ride') || task.toLowerCase().includes('uber') || task.toLowerCase().includes('taxi')) {
        action = 'book_ride';
      } else if (task.toLowerCase().includes('buy') || task.toLowerCase().includes('product') || task.toLowerCase().includes('amazon')) {
        action = 'search_products';
      }

      const { data, error } = await supabase.functions.invoke('browser-automation', {
        body: { action, task }
      });

      if (error) throw error;

      setBrowserSession({
        steps: data.steps,
        currentStep: 0,
        screenshotUrl: data.screenshotUrl,
        status: data.requiresConfirmation ? 'waiting_confirmation' : 'browsing',
        requiresConfirmation: data.requiresConfirmation
      });

      // Simulate step progression
      simulateStepProgression(data.steps);

    } catch (error) {
      console.error('Browser automation error:', error);
      setBrowserSession(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const simulateStepProgression = (steps: string[]) => {
    steps.forEach((step, index) => {
      setTimeout(() => {
        setBrowserSession(prev => ({
          ...prev,
          currentStep: index,
          screenshotUrl: `https://via.placeholder.com/800x600/0f0f23/8b5cf6?text=Step+${index + 1}%0A${encodeURIComponent(step)}`
        }));

        // Add system message for each step
        const systemMessage: Message = {
          id: `step-${Date.now()}-${index}`,
          type: 'system',
          content: `🤖 ${step}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);

        // If last step and requires confirmation
        if (index === steps.length - 1 && browserSession.requiresConfirmation) {
          setBrowserSession(prev => ({ ...prev, status: 'waiting_confirmation' }));
          const confirmMessage: Message = {
            id: `confirm-${Date.now()}`,
            type: 'ai',
            content: "I've completed the browsing and found what you're looking for. Should I proceed with the final action? You can take control anytime if you want to complete it yourself, or give me your login details and I'll handle it securely.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmMessage]);
        }
      }, (index + 1) * 2000);
    });
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
        description: "ElevenLabs voice integration ready - API key needed for full functionality",
      });
    }
  };

  const toggleBrowsingPause = () => {
    const newStatus = browserSession.status === 'paused' ? 'browsing' : 'paused';
    setBrowserSession(prev => ({ ...prev, status: newStatus }));
    
    const statusMessage: Message = {
      id: `status-${Date.now()}`,
      type: 'system',
      content: `🎮 Browser ${newStatus === 'paused' ? 'paused' : 'resumed'}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, statusMessage]);
  };

  const stopBrowsing = () => {
    setBrowserSession({
      steps: [],
      currentStep: 0,
      screenshotUrl: 'https://via.placeholder.com/800x600/0f0f23/8b5cf6?text=AI+Browser+Ready+%0APowered+by+Gemini+%26+Live+Automation%0AType+a+command+to+start+browsing',
      status: 'idle',
      requiresConfirmation: false
    });
    
    const stopMessage: Message = {
      id: `stop-${Date.now()}`,
      type: 'system',
      content: '🛑 Browser session stopped',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, stopMessage]);
  };

  const confirmAction = () => {
    setBrowserSession(prev => ({ ...prev, status: 'idle' }));
    const confirmMessage: Message = {
      id: `confirmed-${Date.now()}`,
      type: 'ai',
      content: "Perfect! I've completed the task for you. Is there anything else you'd like me to help you with?",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const takeControl = () => {
    const controlMessage: Message = {
      id: `control-${Date.now()}`,
      type: 'system',
      content: '👤 You took control of the browser session',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, controlMessage]);
    
    toast({
      title: "Control Taken",
      description: "You can now complete the task manually in the browser preview.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Chat Panel */}
      <div className="w-1/2 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-card/50">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary animate-pulse" />
            <h1 className="text-xl font-semibold text-primary">AI Assistant</h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Powered by Gemini</span>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary' : 
                    message.type === 'system' ? 'bg-accent' : 'bg-secondary'
                  }`}>
                    {message.type === 'user' ? 
                      <User className="h-4 w-4 text-primary-foreground" /> : 
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    }
                  </div>
                  <Card className={`${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.type === 'system'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Confirmation Controls */}
        {browserSession.status === 'waiting_confirmation' && (
          <div className="p-4 border-t border-border bg-accent/10">
            <div className="flex space-x-2">
              <Button onClick={confirmAction} className="flex-1">
                <AlertCircle className="w-4 h-4 mr-2" />
                Confirm Action
              </Button>
              <Button variant="outline" onClick={takeControl} className="flex-1">
                <Monitor className="w-4 h-4 mr-2" />
                Take Control
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what you want me to do... (I can handle passwords securely)"
              className="flex-1"
              disabled={browserSession.status === 'browsing'}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVoiceRecording}
              className={isListening ? 'bg-red-500 text-white' : ''}
              disabled={browserSession.status === 'browsing'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button 
              onClick={handleSendMessage} 
              size="icon"
              disabled={browserSession.status === 'browsing'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Browser Preview Panel */}
      <div className="w-1/2 flex flex-col bg-muted/30">
        {/* Browser Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-card/50">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <Globe className="ml-4 h-5 w-5 text-accent" />
            <span className="text-sm text-muted-foreground">Live Browser Preview</span>
            <div className={`ml-2 px-2 py-1 rounded-full text-xs ${
              browserSession.status === 'idle' ? 'bg-gray-100 text-gray-600' :
              browserSession.status === 'browsing' ? 'bg-green-100 text-green-600' :
              browserSession.status === 'paused' ? 'bg-yellow-100 text-yellow-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {browserSession.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          
          {/* Browser Controls */}
          {browserSession.status !== 'idle' && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBrowsingPause}
                disabled={browserSession.status === 'waiting_confirmation'}
              >
                {browserSession.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {browserSession.status === 'paused' ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={stopBrowsing}
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Browser Content */}
        <div className="flex-1 p-4">
          <div className="w-full h-full bg-white rounded-lg border border-border overflow-hidden shadow-lg">
            <img 
              src={browserSession.screenshotUrl} 
              alt="Browser Preview" 
              className="w-full h-full object-cover"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        </div>

        {/* Step Progress */}
        {browserSession.steps.length > 0 && (
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>AI Progress</span>
                <span>{browserSession.currentStep + 1} / {browserSession.steps.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((browserSession.currentStep + 1) / browserSession.steps.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm">
                {browserSession.steps[browserSession.currentStep] || 'Initializing...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};