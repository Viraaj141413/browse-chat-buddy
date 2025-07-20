import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

interface BrowserSession {
  id: string
  status: string
  currentUrl: string
  screenshotUrl?: string
  steps: string[]
  currentStep: number
}

// In-memory store for browser sessions (in production, use Redis or database)
const activeSessions = new Map<string, BrowserSession>()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Invalid auth token')
    }

    const { action, task, url, credentials, sessionId } = await req.json()
    
    if (!task && !sessionId) {
      throw new Error('Task or sessionId is required')
    }

    // Handle different actions
    switch (action) {
      case 'start_session':
        return await startBrowserSession(user.id, task)
      case 'get_screenshot':
        return await getScreenshot(sessionId)
      case 'perform_action':
        return await performBrowserAction(sessionId, task, credentials)
      case 'pause_session':
        return await pauseSession(sessionId)
      case 'resume_session':
        return await resumeSession(sessionId)
      case 'stop_session':
        return await stopSession(sessionId)
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

async function startBrowserSession(userId: string, task: string) {
  const sessionId = crypto.randomUUID()
  
  // Create browser session record in database
  const { data: session, error } = await supabase
    .from('browser_sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      status: 'active',
      current_url: '',
      last_action: `Starting task: ${task}`
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create session: ' + error.message)
  }

  // Determine steps based on task
  const steps = generateStepsFromTask(task)
  
  // Store session in memory
  const browserSession: BrowserSession = {
    id: sessionId,
    status: 'initializing',
    currentUrl: '',
    steps,
    currentStep: 0
  }
  
  activeSessions.set(sessionId, browserSession)

  // Start browser automation (simulated for now, but structured for real browser)
  await simulateBrowserStart(sessionId, task)

  return new Response(
    JSON.stringify({
      success: true,
      sessionId,
      steps,
      currentStep: 0,
      status: 'initialized'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

async function simulateBrowserStart(sessionId: string, task: string) {
  const session = activeSessions.get(sessionId)
  if (!session) return

  // Simulate opening browser and navigating
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Update session status
  session.status = 'navigating'
  session.currentUrl = determineUrlFromTask(task)
  
  // Generate initial screenshot URL
  const screenshotUrl = await generateScreenshot(sessionId, session.steps[0])
  session.screenshotUrl = screenshotUrl
  
  // Update database
  await supabase
    .from('browser_sessions')
    .update({
      status: session.status,
      current_url: session.currentUrl,
      screenshot_url: screenshotUrl
    })
    .eq('id', sessionId)

  // Log action
  await supabase
    .from('browser_actions')
    .insert({
      session_id: sessionId,
      action_type: 'navigate',
      target_element: session.currentUrl,
      screenshot_url: screenshotUrl,
      success: true
    })
}

async function getScreenshot(sessionId: string) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  // Generate new screenshot
  const screenshotUrl = await generateScreenshot(sessionId, session.steps[session.currentStep])
  session.screenshotUrl = screenshotUrl

  return new Response(
    JSON.stringify({
      success: true,
      screenshotUrl,
      currentStep: session.currentStep,
      status: session.status
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

async function performBrowserAction(sessionId: string, action: string, credentials?: any) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  // Simulate performing action
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  session.currentStep = Math.min(session.currentStep + 1, session.steps.length - 1)
  session.status = session.currentStep >= session.steps.length - 1 ? 'completed' : 'active'
  
  const screenshotUrl = await generateScreenshot(sessionId, session.steps[session.currentStep])
  session.screenshotUrl = screenshotUrl

  // Update database
  await supabase
    .from('browser_sessions')
    .update({
      status: session.status,
      screenshot_url: screenshotUrl,
      last_action: action
    })
    .eq('id', sessionId)

  // Log action
  await supabase
    .from('browser_actions')
    .insert({
      session_id: sessionId,
      action_type: 'click',
      target_element: action,
      screenshot_url: screenshotUrl,
      success: true
    })

  return new Response(
    JSON.stringify({
      success: true,
      screenshotUrl,
      currentStep: session.currentStep,
      status: session.status,
      message: session.steps[session.currentStep]
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

async function pauseSession(sessionId: string) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  session.status = 'paused'
  
  await supabase
    .from('browser_sessions')
    .update({ status: 'paused' })
    .eq('id', sessionId)

  return new Response(
    JSON.stringify({ success: true, status: 'paused' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function resumeSession(sessionId: string) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  session.status = 'active'
  
  await supabase
    .from('browser_sessions')
    .update({ status: 'active' })
    .eq('id', sessionId)

  return new Response(
    JSON.stringify({ success: true, status: 'active' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function stopSession(sessionId: string) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  session.status = 'completed'
  activeSessions.delete(sessionId)
  
  await supabase
    .from('browser_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  return new Response(
    JSON.stringify({ success: true, status: 'completed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function generateStepsFromTask(task: string): string[] {
  const taskLower = task.toLowerCase()
  
  if (taskLower.includes('order') || taskLower.includes('food') || taskLower.includes('delivery')) {
    return [
      'Opening food delivery app...',
      'Searching for restaurants...',
      'Found matching options',
      'Selecting items...',
      'Adding to cart',
      'Ready for checkout confirmation'
    ]
  } else if (taskLower.includes('ride') || taskLower.includes('uber') || taskLower.includes('taxi')) {
    return [
      'Opening ride booking app...',
      'Setting pickup location...',
      'Setting destination...',
      'Finding available drivers',
      'Ready to book ride'
    ]
  } else if (taskLower.includes('shop') || taskLower.includes('buy') || taskLower.includes('purchase')) {
    return [
      'Opening e-commerce site...',
      'Searching for products...',
      'Filtering results...',
      'Found matching items',
      'Ready to add to cart'
    ]
  } else {
    return [
      'Analyzing request...',
      'Opening relevant website...',
      'Navigating to correct section...',
      'Performing requested action...',
      'Task completed'
    ]
  }
}

function determineUrlFromTask(task: string): string {
  const taskLower = task.toLowerCase()
  
  if (taskLower.includes('food') || taskLower.includes('delivery')) {
    return 'https://www.ubereats.com'
  } else if (taskLower.includes('ride') || taskLower.includes('uber')) {
    return 'https://www.uber.com'
  } else if (taskLower.includes('amazon')) {
    return 'https://www.amazon.com'
  } else if (taskLower.includes('shop')) {
    return 'https://www.google.com/search?q=' + encodeURIComponent(task)
  } else {
    return 'https://www.google.com'
  }
}

async function generateScreenshot(sessionId: string, stepDescription: string): Promise<string> {
  // In a real implementation, this would capture actual browser screenshots
  // For now, we'll generate placeholder images that look more realistic
  const timestamp = Date.now()
  const encodedStep = encodeURIComponent(stepDescription)
  
  // Create more realistic placeholder that simulates actual websites
  return `https://via.placeholder.com/1200x800/f8f9fa/333333?text=${encodedStep}&t=${timestamp}`
}