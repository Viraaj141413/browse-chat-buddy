#!/usr/bin/env node

/**
 * BROWSER - Real Browser Automation Server
 * 
 * This is a complete standalone server that controls real browsers using Puppeteer.
 * No simulations - only real browser interactions with live screenshots.
 * 
 * Features:
 * - Real Chromium browser automation
 * - Live screenshot streaming
 * - WebSocket real-time communication
 * - Gemini AI integration for intelligent actions
 * - Supabase integration for session management
 * - Express HTTP API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const puppeteer = require('puppeteer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

// Initialize services
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.BROWSER_PORT || 8080;
const SCREENSHOT_INTERVAL = process.env.SCREENSHOT_INTERVAL || 1000; // ms

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ggojmfbpsqzcyazwnibd.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnb2ptZmJwc3F6Y3lhenduaWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDIwNTEsImV4cCI6MjA2ODUxODA1MX0.1Q7rWqqg3REYUI7pqT36hJXkKbO2njS3ZhVpvtHWaKw'
);

// Gemini AI client
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Global state
const browserSessions = new Map(); // sessionId -> { browser, page, ws, userId }
const screenshotIntervals = new Map(); // sessionId -> intervalId

// Browser class for managing real browser instances
class RealBrowser {
  constructor(sessionId, userId) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.browser = null;
    this.page = null;
    this.isReady = false;
  }

  async initialize() {
    try {
      console.log(`🚀 Launching real browser for session ${this.sessionId}`);
      
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for production
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

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });
      
      // Set user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      this.isReady = true;
      console.log(`✅ Browser ready for session ${this.sessionId}`);
      
      // Create session in database
      await this.updateSessionInDB('active', 'about:blank');
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize browser for session ${this.sessionId}:`, error);
      return false;
    }
  }

  async updateSessionInDB(status, currentUrl, lastAction = null) {
    try {
      await supabase
        .from('browser_sessions')
        .upsert({
          id: this.sessionId,
          user_id: this.userId,
          status,
          current_url: currentUrl,
          last_action: lastAction,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update session in DB:', error);
    }
  }

  async logAction(action, details) {
    try {
      await supabase
        .from('browser_actions')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          action,
          details,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }

  async navigate(url) {
    if (!this.isReady) throw new Error('Browser not ready');
    
    console.log(`🌐 Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await this.updateSessionInDB('active', url, 'navigate');
    await this.logAction('navigate', { url });
    
    return { success: true, url: this.page.url() };
  }

  async click(selector) {
    if (!this.isReady) throw new Error('Browser not ready');
    
    console.log(`👆 Clicking: ${selector}`);
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    await this.logAction('click', { selector });
    
    return { success: true };
  }

  async type(selector, text) {
    if (!this.isReady) throw new Error('Browser not ready');
    
    console.log(`⌨️ Typing in ${selector}: ${text}`);
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.type(selector, text);
    await this.logAction('type', { selector, text });
    
    return { success: true };
  }

  async scroll(direction, amount = 500) {
    if (!this.isReady) throw new Error('Browser not ready');
    
    console.log(`📜 Scrolling ${direction} by ${amount}px`);
    const deltaY = direction === 'down' ? amount : -amount;
    await this.page.evaluate((deltaY) => {
      window.scrollBy(0, deltaY);
    }, deltaY);
    await this.logAction('scroll', { direction, amount });
    
    return { success: true };
  }

  async wait(milliseconds) {
    if (!this.isReady) throw new Error('Browser not ready');
    
    console.log(`⏱️ Waiting ${milliseconds}ms`);
    await new Promise(resolve => setTimeout(resolve, milliseconds));
    await this.logAction('wait', { milliseconds });
    
    return { success: true };
  }

  async takeScreenshot() {
    if (!this.isReady) throw new Error('Browser not ready');
    
    const screenshot = await this.page.screenshot({ 
      type: 'jpeg', 
      quality: 80,
      fullPage: false 
    });
    
    await this.logAction('screenshot', { size: screenshot.length });
    return screenshot;
  }

  async getPageInfo() {
    if (!this.isReady) throw new Error('Browser not ready');
    
    const info = await this.page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    return info;
  }

  async intelligentAction(instruction) {
    if (!genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Get current page context
      const pageInfo = await this.getPageInfo();
      const screenshot = await this.takeScreenshot();
      
      // Create prompt for AI
      const prompt = `
        You are controlling a real browser. Current page: ${pageInfo.title} (${pageInfo.url})
        
        User instruction: "${instruction}"
        
        Available actions:
        1. navigate(url) - Go to a URL
        2. click(selector) - Click an element (CSS selector)
        3. type(selector, text) - Type text in an input field
        4. scroll(direction, amount) - Scroll up/down
        5. wait(milliseconds) - Wait for a period
        
        Respond with a JSON object containing the action to perform:
        { "action": "click", "params": { "selector": "#button-id" } }
        
        Be specific with CSS selectors. For common elements:
        - Buttons: button, input[type="submit"], .btn
        - Links: a[href*="keyword"]
        - Inputs: input[type="text"], input[name="username"]
        - Search: input[type="search"], [placeholder*="search"]
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const actionText = response.text();
      
      // Parse AI response
      const action = JSON.parse(actionText.replace(/```json\n?|\n?```/g, ''));
      
      // Execute the action
      let result_data;
      switch (action.action) {
        case 'navigate':
          result_data = await this.navigate(action.params.url);
          break;
        case 'click':
          result_data = await this.click(action.params.selector);
          break;
        case 'type':
          result_data = await this.type(action.params.selector, action.params.text);
          break;
        case 'scroll':
          result_data = await this.scroll(action.params.direction, action.params.amount);
          break;
        case 'wait':
          result_data = await this.wait(action.params.milliseconds);
          break;
        default:
          throw new Error(`Unknown action: ${action.action}`);
      }
      
      await this.logAction('ai_action', { instruction, action, result: result_data });
      return { success: true, action, result: result_data };
      
    } catch (error) {
      console.error('AI action failed:', error);
      throw error;
    }
  }

  async close() {
    console.log(`🔒 Closing browser for session ${this.sessionId}`);
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isReady = false;
    }
    
    await this.updateSessionInDB('closed', null);
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('📡 New WebSocket connection');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { sessionId, userId, action, params } = data;
      
      console.log(`📨 Received: ${action} for session ${sessionId}`);
      
      // Get or create browser session
      let session = browserSessions.get(sessionId);
      
      if (!session && action === 'init') {
        session = new RealBrowser(sessionId, userId);
        const initialized = await session.initialize();
        
        if (initialized) {
          browserSessions.set(sessionId, session);
          
          // Start screenshot streaming
          const intervalId = setInterval(async () => {
            try {
              if (session.isReady) {
                const screenshot = await session.takeScreenshot();
                const base64 = screenshot.toString('base64');
                
                ws.send(JSON.stringify({
                  type: 'screenshot',
                  sessionId,
                  data: base64,
                  timestamp: Date.now()
                }));
              }
            } catch (error) {
              console.error('Screenshot streaming error:', error);
            }
          }, SCREENSHOT_INTERVAL);
          
          screenshotIntervals.set(sessionId, intervalId);
          
          ws.send(JSON.stringify({
            type: 'init_success',
            sessionId,
            message: 'Browser initialized successfully'
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            sessionId,
            message: 'Failed to initialize browser'
          }));
        }
        return;
      }
      
      if (!session) {
        ws.send(JSON.stringify({
          type: 'error',
          sessionId,
          message: 'Session not found. Initialize first.'
        }));
        return;
      }
      
      // Execute browser actions
      let result;
      switch (action) {
        case 'navigate':
          result = await session.navigate(params.url);
          break;
        case 'click':
          result = await session.click(params.selector);
          break;
        case 'type':
          result = await session.type(params.selector, params.text);
          break;
        case 'scroll':
          result = await session.scroll(params.direction, params.amount);
          break;
        case 'wait':
          result = await session.wait(params.milliseconds);
          break;
        case 'ai_action':
          result = await session.intelligentAction(params.instruction);
          break;
        case 'screenshot':
          const screenshot = await session.takeScreenshot();
          const base64 = screenshot.toString('base64');
          result = { success: true, screenshot: base64 };
          break;
        case 'page_info':
          result = await session.getPageInfo();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      ws.send(JSON.stringify({
        type: 'action_result',
        sessionId,
        action,
        result
      }));
      
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('📡 WebSocket disconnected');
    // Clean up any sessions for this connection
    for (const [sessionId, session] of browserSessions.entries()) {
      // Note: In production, you'd want better session management
      // This is a simplified cleanup
    }
  });
});

// HTTP API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    sessions: browserSessions.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('browser_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      sessions: sessions || [],
      active_sessions: browserSessions.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sessions/:sessionId/actions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data: actions, error } = await supabase
      .from('browser_actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    res.json({
      success: true,
      actions: actions || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sessions/:sessionId/close', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = browserSessions.get(sessionId);
    
    if (session) {
      await session.close();
      browserSessions.delete(sessionId);
      
      // Clear screenshot interval
      const intervalId = screenshotIntervals.get(sessionId);
      if (intervalId) {
        clearInterval(intervalId);
        screenshotIntervals.delete(sessionId);
      }
    }
    
    res.json({ success: true, message: 'Session closed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down BROWSER server...');
  
  // Close all browser sessions
  for (const [sessionId, session] of browserSessions.entries()) {
    try {
      await session.close();
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    }
  }
  
  // Clear all intervals
  for (const intervalId of screenshotIntervals.values()) {
    clearInterval(intervalId);
  }
  
  server.close(() => {
    console.log('👋 BROWSER server stopped');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`
🌐 BROWSER Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 HTTP API:    http://localhost:${PORT}
📡 WebSocket:   ws://localhost:${PORT}
🔍 Health:      http://localhost:${PORT}/health
📊 Sessions:    http://localhost:${PORT}/sessions

🧠 AI Engine:   ${genAI ? '✅ Gemini Connected' : '❌ No API Key'}
🗄️  Database:   ${supabase ? '✅ Supabase Connected' : '❌ Not Connected'}

Ready to control real browsers! 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = { app, server, browserSessions };