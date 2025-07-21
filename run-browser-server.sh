
#!/bin/bash

echo "🚀 Starting AI Browser Automation System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install puppeteer express cors body-parser ws dotenv @supabase/supabase-js @google/generative-ai
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
NODE_ENV=development
BROWSER_PORT=8080
SCREENSHOT_INTERVAL=1000
SUPABASE_URL=https://ggojmfbpsqzcyazwnibd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnb2ptZmJwc3F6Y3lhenduaWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDIwNTEsImV4cCI6MjA2ODUxODA1MX0.1Q7rWqqg3REYUI7pqT36hJXkKbO2njS3ZhVpvtHWaKw
GEMINI_API_KEY=AIzaSyBzIwU6Kn_0J77zo8tgTtlJpU_y5S4LbbM
EOF
fi

echo "✅ Environment configured"
echo "🌐 Starting browser automation server..."
echo ""

# Start the browser server
node start-browser.js
