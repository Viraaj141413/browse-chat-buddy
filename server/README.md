
# CloudAI Server

A real-time browser automation server with AI-powered commands using OpenRouter API.

## Features

- Real Puppeteer browser automation (headful mode)
- WebSocket streaming of live screenshots at 10 FPS
- AI-powered command processing using OpenRouter
- Real-time browser control and preview

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
PORT=8080
OPENROUTER_API_KEY=your_api_key_here
```

3. Start the server:
```bash
npm start
```

## Usage

The server will:
1. Launch a real Chrome browser window
2. Stream live screenshots via WebSocket
3. Process AI commands through OpenRouter
4. Execute browser actions in real-time

## API Endpoints

- `GET /health` - Health check
- WebSocket connection on port 8080 for real-time communication

## Commands

Send commands via WebSocket:
- "search for cats" - Searches Google
- "go to youtube.com" - Navigates to YouTube
- "click on first result" - Clicks elements
- Any natural language command - AI will interpret and execute
