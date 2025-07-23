import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let browser: any = null;
  let page: any = null;
  let screenshotInterval: any = null;

  // AI Service using OpenRouter
  class AIService {
    private apiKey = "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";
    private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    async processCommand(message: string) {
      try {
        console.log('Processing command:', message);
        
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: "qwen/qwen3-235b-a22b-07-25:free",
            messages: [
              {
                role: "system",
                content: "You are a browser automation assistant. Parse user commands and return JSON with browser actions. Available actions: navigate, click, type, scroll, wait. Always return valid JSON in this format: {\"action\": \"navigate\", \"params\": {\"url\": \"https://google.com\"}} or {\"action\": \"type\", \"params\": {\"selector\": \"input[name='q']\", \"text\": \"hello\"}}. For searches, navigate to google.com first then type in the search box."
              },
              {
                role: "user",
                content: message
              }
            ]
          })
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        console.log('AI Response:', aiResponse);
        
        try {
          return JSON.parse(aiResponse);
        } catch (e) {
          // Fallback parsing
          if (message.toLowerCase().includes('search')) {
            const searchTerm = message.replace(/search for?/i, '').trim();
            return {
              action: "navigate",
              params: { url: "https://google.com" }
            };
          } else if (message.toLowerCase().includes('go to') || message.toLowerCase().includes('visit')) {
            const url = message.match(/(?:go to|visit)\s+(.+)/i);
            return {
              action: "navigate",
              params: { url: url ? url[1] : "https://google.com" }
            };
          }
          return {
            action: "navigate",
            params: { url: "https://google.com" }
          };
        }
      } catch (error) {
        console.error('AI Service Error:', error);
        return {
          action: "navigate",
          params: { url: "https://google.com" }
        };
      }
    }
  }

  const aiService = new AIService();

  // Initialize browser function
  async function initializeBrowser() {
    try {
      console.log('Initializing browser...');
      
      // Import Puppeteer dynamically
      const puppeteer = await import("https://deno.land/x/puppeteer@16.2.0/mod.ts");
      
      if (browser) {
        await browser.close();
      }

      browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      await page.goto('https://google.com');
      
      console.log('Browser initialized successfully');
      startScreenshotStream();
      
      return { success: true, message: 'Browser initialized' };
    } catch (error) {
      console.error('Browser initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Execute browser action
  async function executeAction(action: any) {
    try {
      if (!page) {
        throw new Error('Browser not initialized');
      }

      console.log('Executing action:', action);

      switch (action.action) {
        case 'navigate':
          await page.goto(action.params.url, { waitUntil: 'networkidle2' });
          break;
        
        case 'click':
          await page.waitForSelector(action.params.selector, { timeout: 5000 });
          await page.click(action.params.selector);
          break;
        
        case 'type':
          await page.waitForSelector(action.params.selector, { timeout: 5000 });
          await page.type(action.params.selector, action.params.text);
          break;
        
        case 'scroll':
          await page.evaluate((pixels) => {
            window.scrollBy(0, pixels);
          }, action.params.pixels || 500);
          break;
        
        case 'wait':
          await page.waitForTimeout(action.params.ms || 1000);
          break;
        
        default:
          throw new Error(`Unknown action: ${action.action}`);
      }

      return { success: true, message: `Action ${action.action} executed` };
    } catch (error) {
      console.error('Action execution error:', error);
      return { success: false, error: error.message };
    }
  }

  // Screenshot streaming
  function startScreenshotStream() {
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
    }

    screenshotInterval = setInterval(async () => {
      try {
        if (page && socket.readyState === WebSocket.OPEN) {
          const screenshot = await page.screenshot({ 
            type: 'jpeg', 
            quality: 80,
            fullPage: false 
          });
          
          // Convert Uint8Array to base64
          const base64Screenshot = btoa(String.fromCharCode(...screenshot));
          const url = await page.url();
          
          socket.send(JSON.stringify({
            type: 'screenshot',
            data: base64Screenshot,
            url: url,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Screenshot error:', error);
      }
    }, 500); // 2 FPS for better performance
  }

  socket.onopen = () => {
    console.log('WebSocket connection opened');
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      switch (data.type) {
        case 'init':
          const initResult = await initializeBrowser();
          socket.send(JSON.stringify({
            type: 'init_response',
            ...initResult
          }));
          break;

        case 'command':
          // Process command with AI
          const action = await aiService.processCommand(data.message);
          
          // Execute the action
          const result = await executeAction(action);
          
          socket.send(JSON.stringify({
            type: 'command_response',
            action: action,
            result: result,
            originalMessage: data.message
          }));
          break;

        case 'stop':
          if (screenshotInterval) {
            clearInterval(screenshotInterval);
            screenshotInterval = null;
          }
          if (browser) {
            await browser.close();
            browser = null;
            page = null;
          }
          socket.send(JSON.stringify({
            type: 'stop_response',
            success: true,
            message: 'Browser stopped'
          }));
          break;

        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
      screenshotInterval = null;
    }
    if (browser) {
      browser.close();
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return response;
});