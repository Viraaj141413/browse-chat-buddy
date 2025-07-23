
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Global state
let browser = null;
let page = null;
let screenshotInterval = null;
const connectedClients = new Set();

// AI Service using OpenRouter
class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async processCommand(message) {
    try {
      const response = await axios.post(this.baseUrl, {
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
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('AI Response:', aiResponse);
      
      // Try to parse JSON from AI response
      try {
        return JSON.parse(aiResponse);
      } catch (e) {
        // Fallback parsing if AI doesn't return proper JSON
        if (message.toLowerCase().includes('search')) {
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

// Browser automation functions
async function initializeBrowser() {
  try {
    if (browser) {
      await browser.close();
    }

    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
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

async function executeAction(action) {
  try {
    if (!page) {
      throw new Error('Browser not initialized');
    }

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

function startScreenshotStream() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }

  screenshotInterval = setInterval(async () => {
    try {
      if (page && connectedClients.size > 0) {
        const screenshot = await page.screenshot({ 
          type: 'jpeg', 
          quality: 80,
          fullPage: false 
        });
        
        const base64Screenshot = screenshot.toString('base64');
        const url = await page.url();
        
        const message = JSON.stringify({
          type: 'screenshot',
          data: base64Screenshot,
          url: url,
          timestamp: Date.now()
        });

        connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  }, 100); // 10 FPS
}

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  connectedClients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      switch (data.type) {
        case 'init':
          const initResult = await initializeBrowser();
          ws.send(JSON.stringify({
            type: 'init_response',
            ...initResult
          }));
          break;

        case 'command':
          // Process command with AI
          const action = await aiService.processCommand(data.message);
          
          // Execute the action
          const result = await executeAction(action);
          
          ws.send(JSON.stringify({
            type: 'command_response',
            action: action,
            result: result,
            originalMessage: data.message
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    connectedClients.delete(ws);
    
    if (connectedClients.size === 0) {
      if (screenshotInterval) {
        clearInterval(screenshotInterval);
        screenshotInterval = null;
      }
    }
  });
});

// HTTP endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    clients: connectedClients.size,
    browserReady: !!browser 
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  
  if (browser) {
    await browser.close();
  }
  
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`CloudAI Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
