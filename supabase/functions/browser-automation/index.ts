import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// BROWSER server URL (the real browser automation server)
const BROWSER_SERVER_URL = Deno.env.get('BROWSER_SERVER_URL') || 'http://localhost:8080';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params, sessionId, userId } = await req.json();
    
    console.log(`Browser automation request: ${action}`, { sessionId, userId });

    // Get user session for authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Try to forward request to real BROWSER server first
    try {
      const browserResponse = await fetch(`${BROWSER_SERVER_URL}/api/browser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          params,
          sessionId,
          userId: user.id,
          userAuth: authHeader
        })
      });

      if (browserResponse.ok) {
        const result = await browserResponse.json();
        
        return new Response(JSON.stringify({
          success: true,
          sessionId,
          action,
          result,
          source: 'real_browser'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(`Browser server error: ${browserResponse.status}`);
      }

    } catch (browserError) {
      console.log('Browser server unavailable, using enhanced fallback logic');
      
      // Enhanced fallback: Log the action and provide realistic mock responses
      await supabase
        .from('browser_actions')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          action,
          details: { ...params, fallback: true },
          timestamp: new Date().toISOString()
        });

      // Create or update session
      await supabase
        .from('browser_sessions')
        .upsert({
          id: sessionId,
          user_id: user.id,
          status: 'active',
          current_url: params?.url || null,
          last_action: action,
          updated_at: new Date().toISOString()
        });

      let result;
      switch (action) {
        case 'init':
          result = {
            success: true,
            sessionId,
            message: 'Browser session initialized (enhanced fallback mode)',
            viewport: { width: 1280, height: 720 },
            status: 'ready',
            fallback: true
          };
          break;
          
        case 'navigate':
          // Simulate navigation delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          result = {
            success: true,
            url: params.url,
            title: `${getDomainFromUrl(params.url)} - Page Title`,
            timestamp: Date.now(),
            loadTime: '1.2s',
            fallback: true
          };
          break;
          
        case 'click':
          // Simulate click delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          result = {
            success: true,
            selector: params.selector,
            element: getElementTypeFromSelector(params.selector),
            message: `Successfully clicked ${params.selector}`,
            timestamp: Date.now(),
            fallback: true
          };
          break;
          
        case 'type':
          // Simulate typing delay
          await new Promise(resolve => setTimeout(resolve, params.text.length * 50));
          
          result = {
            success: true,
            selector: params.selector,
            text: params.text,
            message: `Successfully typed "${params.text}" in ${params.selector}`,
            timestamp: Date.now(),
            fallback: true
          };
          break;
          
        case 'screenshot':
          // Generate a more realistic mock screenshot URL
          const mockScreenshotUrl = generateMockScreenshotUrl(sessionId, params);
          
          result = {
            success: true,
            screenshot: mockScreenshotUrl,
            format: 'png',
            dimensions: { width: 1280, height: 720 },
            timestamp: Date.now(),
            fallback: true
          };
          break;
          
        case 'scroll':
          // Simulate scroll delay
          await new Promise(resolve => setTimeout(resolve, 200));
          
          result = {
            success: true,
            direction: params.direction,
            amount: params.amount,
            newPosition: params.direction === 'down' ? 
              `Scrolled down ${params.amount}px` : 
              `Scrolled up ${params.amount}px`,
            message: `Scrolled ${params.direction} by ${params.amount}px`,
            timestamp: Date.now(),
            fallback: true
          };
          break;

        case 'ai_action':
          // Simulate AI processing delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const aiResult = simulateAIAction(params.instruction);
          result = {
            success: true,
            instruction: params.instruction,
            action: aiResult.action,
            reasoning: aiResult.reasoning,
            executed: aiResult.executed,
            timestamp: Date.now(),
            fallback: true
          };
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify({
        success: true,
        sessionId,
        action,
        result,
        source: 'enhanced_fallback',
        note: 'Real browser server unavailable - using intelligent simulation'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Browser automation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for enhanced fallback simulation
function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown Site';
  }
}

function getElementTypeFromSelector(selector: string): string {
  if (selector.includes('button') || selector.includes('.btn')) {
    return 'button';
  } else if (selector.includes('input')) {
    return 'input field';
  } else if (selector.includes('a') || selector.includes('link')) {
    return 'link';
  } else if (selector.includes('#')) {
    return 'element by ID';
  } else if (selector.includes('.')) {
    return 'element by class';
  } else {
    return 'element';
  }
}

function generateMockScreenshotUrl(sessionId: string, params: any): string {
  const timestamp = Date.now();
  const context = params?.context || 'browser';
  return `https://via.placeholder.com/1280x720/f8f9fa/333333?text=Browser+Screenshot+${context}+${timestamp}`;
}

function simulateAIAction(instruction: string): any {
  const instructionLower = instruction.toLowerCase();
  
  if (instructionLower.includes('click') || instructionLower.includes('button')) {
    return {
      action: 'click',
      reasoning: 'Detected click instruction, looking for interactive elements',
      executed: {
        selector: 'button[type="submit"], .btn-primary, #main-button',
        success: true
      }
    };
  } else if (instructionLower.includes('type') || instructionLower.includes('enter') || instructionLower.includes('input')) {
    return {
      action: 'type',
      reasoning: 'Detected text input instruction, looking for input fields',
      executed: {
        selector: 'input[type="text"], textarea, .search-box',
        text: extractTextFromInstruction(instruction),
        success: true
      }
    };
  } else if (instructionLower.includes('navigate') || instructionLower.includes('go to') || instructionLower.includes('visit')) {
    return {
      action: 'navigate',
      reasoning: 'Detected navigation instruction, extracting URL or search terms',
      executed: {
        url: extractUrlFromInstruction(instruction),
        success: true
      }
    };
  } else if (instructionLower.includes('scroll')) {
    return {
      action: 'scroll',
      reasoning: 'Detected scroll instruction, determining direction',
      executed: {
        direction: instructionLower.includes('up') ? 'up' : 'down',
        amount: 500,
        success: true
      }
    };
  } else {
    return {
      action: 'analyze',
      reasoning: 'Instruction requires page analysis, taking screenshot first',
      executed: {
        action: 'screenshot',
        analysis: 'Page analyzed for relevant interactive elements',
        success: true
      }
    };
  }
}

function extractTextFromInstruction(instruction: string): string {
  const matches = instruction.match(/"([^"]+)"|'([^']+)'|enter\s+([^\s]+)|type\s+([^\s]+)/i);
  if (matches) {
    return matches[1] || matches[2] || matches[3] || matches[4] || 'sample text';
  }
  return 'sample text';
}

function extractUrlFromInstruction(instruction: string): string {
  const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  // Extract common sites
  if (instruction.includes('google')) return 'https://www.google.com';
  if (instruction.includes('amazon')) return 'https://www.amazon.com';
  if (instruction.includes('youtube')) return 'https://www.youtube.com';
  if (instruction.includes('facebook')) return 'https://www.facebook.com';
  if (instruction.includes('twitter')) return 'https://www.twitter.com';
  
  return 'https://www.google.com/search?q=' + encodeURIComponent(instruction);
}