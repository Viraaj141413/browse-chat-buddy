
import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useCloudAI } from '@/hooks/useCloudAI';
import { 
  Send, 
  Monitor,
  User,
  Bot,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe
} from 'lucide-react';

export const CloudAIInterface = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, browserState, isLoading, sendCommand, connect, startBrowser, stopBrowser } = useCloudAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    sendCommand(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    switch (browserState.status) {
      case 'connected':
        return 'bg-yellow-500';
      case 'browser_ready':
        return 'bg-green-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (browserState.status) {
      case 'connected':
        return 'Initializing Browser...';
      case 'browser_ready':
        return 'Ready';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CloudAI Browser
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered web automation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
              {getStatusText()}
            </Badge>
            <Button 
              variant={browserState.browserRunning ? "destructive" : "default"}
              size="sm" 
              onClick={browserState.browserRunning ? stopBrowser : startBrowser}
              disabled={isLoading}
              className="transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {browserState.browserRunning ? "Stop" : "Start"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Panel */}
        <div className="w-1/2 border-r border-border flex flex-col bg-background/50">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-fade-in ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="w-8 h-8 shadow-sm">
                      <AvatarFallback className={
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                          : message.type === 'system'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                      }>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : 
                         message.type === 'system' ? <Monitor className="w-4 h-4" /> :
                         <Bot className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <Card className={`shadow-lg transition-all duration-200 hover:shadow-xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0' 
                        : message.type === 'system'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0'
                        : 'bg-card/80 backdrop-blur-sm border border-border/50'
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
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
                      <AvatarFallback className="bg-purple-500 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI is processing...</span>
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
          <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !browserState.connected 
                    ? "Connecting to server..." 
                    : !browserState.browserRunning 
                    ? "Start browser to chat with AI..."
                    : "Type your command... (e.g., 'search for cats', 'go to youtube.com')"
                }
                className="flex-1 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                disabled={isLoading || !browserState.browserRunning}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon"
                disabled={isLoading || !inputMessage.trim() || !browserState.browserRunning}
                className="bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Browser Preview Panel */}
        <div className="w-1/2 flex flex-col bg-background/30">
          {/* Browser Header */}
          <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Live Browser</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground max-w-[200px] truncate bg-background/50 px-2 py-1 rounded">
                  {browserState.currentUrl || 'No URL'}
                </div>
                <Button variant="outline" size="sm" className="hover:bg-muted transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Browser Content */}
          <div className="flex-1 bg-background border border-border/20 m-2 rounded-lg overflow-hidden shadow-inner">
            {browserState.screenshot ? (
              <img 
                src={`data:image/jpeg;base64,${browserState.screenshot}`}
                alt="Browser Preview" 
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-6 p-8">
                  <div className="relative">
                    <Monitor className="w-20 h-20 text-muted-foreground mx-auto" />
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-full blur-xl"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-foreground">Browser Preview</h3>
                    <p className="text-muted-foreground mt-2">
                      {browserState.connected 
                        ? browserState.browserRunning 
                          ? 'Browser is starting...' 
                          : 'Click Start to begin browsing'
                        : 'Connecting to server...'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
