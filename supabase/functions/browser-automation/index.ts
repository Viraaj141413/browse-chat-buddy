
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
const BROWSER_SERVER_URL = 'http://localhost:8080';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params, sessionId, task } = await req.json();
    
    console.log(`Browser automation request: ${action}`, { sessionId, params });

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

    // Generate session ID if not provided
    const currentSessionId = sessionId || `session_${Date.now()}_${user.id}`;

    // Handle different actions
    switch (action) {
      case 'start_session':
        return await handleStartSession(currentSessionId, user.id, task);
      
      case 'init':
        return await handleInitBrowser(currentSessionId, user.id, params);
      
      case 'navigate':
        return await handleNavigate(currentSessionId, user.id, params);
      
      case 'click':
        return await handleClick(currentSessionId, user.id, params);
      
      case 'type':
        return await handleType(currentSessionId, user.id, params);
      
      case 'screenshot':
        return await handleScreenshot(currentSessionId, user.id);
      
      case 'ai_action':
        return await handleAIAction(currentSessionId, user.id, params);
      
      case 'pause_session':
        return await handlePauseSession(currentSessionId, user.id);
      
      case 'resume_session':
        return await handleResumeSession(currentSessionId, user.id);
      
      case 'stop_session':
        return await handleStopSession(currentSessionId, user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
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

async function handleStartSession(sessionId: string, userId: string, task: string) {
  try {
    // Create session in database
    await supabase
      .from('browser_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        status: 'active',
        current_url: 'about:blank',
        last_action: 'start_session',
        updated_at: new Date().toISOString()
      });

    // Generate AI instructions for the task
    const steps = await generateTaskSteps(task);
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      steps,
      currentStep: 0,
      status: 'active',
      message: 'Browser session started successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Failed to start session: ${error.message}`);
  }
}

async function handleInitBrowser(sessionId: string, userId: string, params: any) {
  try {
    // The BROWSER.js server expects WebSocket or direct HTTP API calls
    // Let's use a direct HTTP call to test connectivity first
    const browserResponse = await fetch(`${BROWSER_SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!browserResponse.ok) {
      throw new Error(`Browser server not accessible: ${browserResponse.status}`);
    }

    const healthCheck = await browserResponse.json();
    console.log('Browser server health:', healthCheck);
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      result: {
        success: true,
        message: 'Browser server is accessible and ready',
        viewport: { width: 1280, height: 720 },
        status: 'ready',
        serverHealth: healthCheck
      },
      source: 'real_browser'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Browser server connection failed:', error);
    // Fallback to mock if real browser fails
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      result: {
        success: true,
        message: 'Browser initialized (fallback mode - server not running)',
        viewport: { width: 1280, height: 720 },
        status: 'ready',
        error: error.message
      },
      source: 'fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleNavigate(sessionId: string, userId: string, params: any) {
  try {
    const browserResponse = await fetch(`${BROWSER_SERVER_URL}/api/browser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'navigate',
        sessionId,
        userId,
        params
      })
    });

    if (!browserResponse.ok) {
      throw new Error(`Browser server error: ${browserResponse.status}`);
    }

    const result = await browserResponse.json();
    
    // Update session in database
    await supabase
      .from('browser_sessions')
      .update({
        current_url: params.url,
        last_action: 'navigate',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      result,
      source: 'real_browser'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Navigation failed: ${error.message}`);
  }
}

async function handleClick(sessionId: string, userId: string, params: any) {
  try {
    const browserResponse = await fetch(`${BROWSER_SERVER_URL}/api/browser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'click',
        sessionId,
        userId,
        params
      })
    });

    if (!browserResponse.ok) {
      throw new Error(`Browser server error: ${browserResponse.status}`);
    }

    const result = await browserResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      result,
      source: 'real_browser'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Click failed: ${error.message}`);
  }
}

async function handleType(sessionId: string, userId: string, params: any) {
  try {
    const browserResponse = await fetch(`${BROWSER_SERVER_URL}/api/browser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'type',
        sessionId,
        userId,
        params
      })
    });

    if (!browserResponse.ok) {
      throw new Error(`Browser server error: ${browserResponse.status}`);
    }

    const result = await browserResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      result,
      source: 'real_browser'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Type failed: ${error.message}`);
  }
}

async function handleScreenshot(sessionId: string, userId: string) {
  try {
    const browserResponse = await fetch(`${BROWSER_SERVER_URL}/api/browser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'screenshot',
        sessionId,
        userId
      })
    });

    if (!browserResponse.ok) {
      throw new Error(`Browser server error: ${browserResponse.status}`);
    }

    const result = await browserResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      screenshotUrl: result.screenshot ? `data:image/png;base64,${result.screenshot}` : null,
      currentStep: 0,
      source: 'real_browser'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Return mock screenshot if real browser fails
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      screenshotUrl: 'https://via.placeholder.com/1280x720/f8f9fa/333333?text=Browser+Screenshot',
      currentStep: 0,
      source: 'fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAIAction(sessionId: string, userId: string, params: any) {
  try {
    const browserResponse = await fetch(`${BROWSER_SERVER_URL}/api/browser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ai_action',
        sessionId,
        userId,
        params
      })
    });

    if (!browserResponse.ok) {
      throw new Error(`Browser server error: ${browserResponse.status}`);
    }

    const result = await browserResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      result,
      source: 'real_browser'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`AI action failed: ${error.message}`);
  }
}

async function handlePauseSession(sessionId: string, userId: string) {
  try {
    await supabase
      .from('browser_sessions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      status: 'paused',
      message: 'Session paused successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Pause failed: ${error.message}`);
  }
}

async function handleResumeSession(sessionId: string, userId: string) {
  try {
    await supabase
      .from('browser_sessions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      status: 'active',
      message: 'Session resumed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Resume failed: ${error.message}`);
  }
}

async function handleStopSession(sessionId: string, userId: string) {
  try {
    // Stop the browser session
    await fetch(`${BROWSER_SERVER_URL}/sessions/${sessionId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Update database
    await supabase
      .from('browser_sessions')
      .update({
        status: 'stopped',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      status: 'stopped',
      message: 'Session stopped successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Stop failed: ${error.message}`);
  }
}

async function generateTaskSteps(task: string) {
  // Simple task breakdown - in a real app, you'd use AI for this
  const steps = [
    { id: 1, description: 'Initialize browser', status: 'pending' },
    { id: 2, description: 'Navigate to target site', status: 'pending' },
    { id: 3, description: 'Perform requested action', status: 'pending' },
    { id: 4, description: 'Complete task', status: 'pending' }
  ];

  return steps;
}
