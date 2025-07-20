import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Send, 
  Play, 
  Pause, 
  Square, 
  Monitor,
  User,
  Bot,
  Loader2,
  Settings,
  LogOut,
  UserCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

type BrowserStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export const AIInterface = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. I can browse the web and perform tasks for you. What would you like me to do?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get the session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // First, get AI response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message: inputMessage,
          context: 'web browsing assistant'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (aiError) throw aiError;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Then start browser automation
      const { data: browserResponse, error: browserError } = await supabase.functions.invoke('browser-automation', {
        body: {
          action: 'start_session',
          task: inputMessage
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (browserError) throw browserError;

      if (browserResponse.success) {
        setSessionId(browserResponse.sessionId);
        setTotalSteps(browserResponse.steps.length);
        setCurrentStep(browserResponse.currentStep);
        setBrowserStatus('running');
        
        // Start polling for screenshots
        startScreenshotPolling(browserResponse.sessionId);
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to process request: ' + error.message);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startScreenshotPolling = (sessionId: string) => {
    const pollScreenshots = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase.functions.invoke('browser-automation', {
          body: {
            action: 'get_screenshot',
            sessionId
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;

        if (data.success) {
          setScreenshotUrl(data.screenshotUrl);
          setCurrentStep(data.currentStep);
          
          if (data.status === 'completed') {
            setBrowserStatus('completed');
            return;
          }
        }
      } catch (error) {
        console.error('Screenshot polling error:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollScreenshots, 3000);
    
    // Clean up after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);
  };

  const handlePause = async () => {
    if (!sessionId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('browser-automation', {
        body: {
          action: 'pause_session',
          sessionId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        setBrowserStatus('paused');
        toast.success('Browser automation paused');
      }
    } catch (error: any) {
      toast.error('Failed to pause: ' + error.message);
    }
  };

  const handleResume = async () => {
    if (!sessionId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('browser-automation', {
        body: {
          action: 'resume_session',
          sessionId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        setBrowserStatus('running');
        toast.success('Browser automation resumed');
      }
    } catch (error: any) {
      toast.error('Failed to resume: ' + error.message);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('browser-automation', {
        body: {
          action: 'stop_session',
          sessionId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        setBrowserStatus('idle');
        setSessionId(null);
        setScreenshotUrl('');
        setCurrentStep(0);
        setTotalSteps(0);
        toast.success('Browser automation stopped');
      }
    } catch (error: any) {
      toast.error('Failed to stop: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/70 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Browser Assistant</h1>
              <p className="text-sm text-muted-foreground">Live web browsing powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={browserStatus === 'running' ? 'default' : browserStatus === 'paused' ? 'secondary' : 'outline'}>
              {browserStatus === 'running' && <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />}
              {browserStatus.charAt(0).toUpperCase() + browserStatus.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Avatar className="w-6 h-6 mr-2">
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || <UserCircle className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  {user?.email?.split('@')[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Panel */}
        <div className="w-1/2 border-r border-border flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <Card className={`${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
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
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what you want me to do..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
                className={isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button 
                onClick={handleSendMessage} 
                size="icon"
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Browser Preview Panel */}
        <div className="w-1/2 flex flex-col">
          {/* Browser Header */}
          <div className="p-4 border-b border-border bg-card/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <Monitor className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Live Browser Preview</span>
              </div>

              {browserStatus !== 'idle' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={browserStatus === 'paused' ? handleResume : handlePause}
                  >
                    {browserStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStop}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Browser Content */}
          <div className="flex-1 p-4">
            <div className="w-full h-full bg-white rounded-lg border shadow-lg overflow-hidden">
              {screenshotUrl ? (
                <img 
                  ref={screenshotRef}
                  src={screenshotUrl} 
                  alt="Browser Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50">
                  <div className="text-center space-y-4">
                    <Monitor className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-semibold text-lg">Browser Ready</h3>
                      <p className="text-muted-foreground">Send a message to start live browsing</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {totalSteps > 0 && (
            <div className="p-4 border-t border-border">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{currentStep + 1} / {totalSteps}</span>
                </div>
                <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {browserStatus === 'running' ? 'AI is working...' : 
                   browserStatus === 'paused' ? 'Paused' : 
                   browserStatus === 'completed' ? 'Task completed!' : 'Ready'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};