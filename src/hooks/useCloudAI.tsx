
import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

interface BrowserState {
  connected: boolean;
  currentUrl: string;
  screenshot: string;
  status: string;
}

export const useCloudAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [browserState, setBrowserState] = useState<BrowserState>({
    connected: false,
    currentUrl: '',
    screenshot: '',
    status: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    ws.current = new WebSocket('ws://localhost:8080');
    
    ws.current.onopen = () => {
      console.log('Connected to CloudAI server');
      setBrowserState(prev => ({ ...prev, connected: true, status: 'connected' }));
      reconnectAttempts.current = 0;
      
      // Initialize browser
      ws.current?.send(JSON.stringify({ type: 'init' }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'screenshot':
          setBrowserState(prev => ({
            ...prev,
            screenshot: data.data,
            currentUrl: data.url
          }));
          break;
          
        case 'init_response':
          setBrowserState(prev => ({
            ...prev,
            status: data.success ? 'browser_ready' : 'browser_error'
          }));
          
          if (data.success) {
            addMessage({
              type: 'system',
              content: 'Browser initialized successfully. You can now send commands!'
            });
          } else {
            addMessage({
              type: 'system',
              content: `Browser initialization failed: ${data.error}`
            });
          }
          break;
          
        case 'command_response':
          setIsLoading(false);
          addMessage({
            type: 'ai',
            content: `Executed: ${data.action.action} - ${data.result.success ? 'Success' : 'Failed: ' + data.result.error}`
          });
          break;
          
        case 'error':
          setIsLoading(false);
          addMessage({
            type: 'system',
            content: `Error: ${data.message}`
          });
          break;
      }
    };

    ws.current.onclose = () => {
      console.log('Disconnected from CloudAI server');
      setBrowserState(prev => ({ ...prev, connected: false, status: 'disconnected' }));
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(() => {
          connect();
        }, 2000 * reconnectAttempts.current);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setBrowserState(prev => ({ ...prev, status: 'error' }));
    };
  };

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date()
    }]);
  };

  const sendCommand = (command: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      addMessage({
        type: 'system',
        content: 'Not connected to server. Please wait for connection.'
      });
      return;
    }

    addMessage({
      type: 'user',
      content: command
    });

    setIsLoading(true);
    ws.current.send(JSON.stringify({
      type: 'command',
      message: command
    }));
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return {
    messages,
    browserState,
    isLoading,
    sendCommand,
    connect
  };
};
