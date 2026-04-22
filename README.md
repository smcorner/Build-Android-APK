# Vibe AI Agent 🤖

## Ultimate Free AI Platform - Vibe Coding with Plain English

A comprehensive AI agent application that uses **100% FREE APIs** with automatic rotation to ensure uninterrupted service.

![Vibe AI Agent](https://img.shields.io/badge/AI-Powered-667eea) ![Free APIs](https://img.shields.io/badge/APIs-100%25%20Free-48bb78) ![No Limits](https://img.shields.io/badge/Limits-Auto%20Rotation-ed8936)

## ✨ Features

### 🤖 AI Chat & Code Generation
- **Vibe Coding**: Describe what you want in plain English
- Multiple free AI models (Gemini, Llama, Mistral, Qwen, DeepSeek, Grok)
- Streaming responses for real-time output
- Code generation, debugging, and explanations

### 🎨 Image Generation
- Stable Diffusion 3 & XL (via Puter.js)
- Flux (via Pollinations AI)
- Grok 2 Image
- Custom dimensions and negative prompts

### 📝 OCR (Optical Character Recognition)
- Extract text from images using AI vision
- Drag & drop or click to upload
- Copy or download extracted text

### 🔍 Regex Tester & Generator
- Real-time regex testing
- AI-powered regex generation from plain English
- Flag support (g, i, m)

### 💻 Code Editor
- Multi-language support (JS, Python, HTML, CSS, etc.)
- AI-powered code formatting and fixing
- Run JavaScript directly
- Save and download files

### 👁️ Live Preview
- Preview HTML/CSS/JS in real-time
- Responsive device preview (Desktop, Tablet, Mobile)

### 📁 File Management
- Create, edit, and organize files
- Import external files
- Project structure management

### 🐛 Debug Console
- Real-time API call logging
- Provider status monitoring
- Error tracking

## 🚀 Architecture

### API Providers (All Free!)
1. **Puter.js** (Primary) - Access to 200+ models including:
   - Google Gemini
   - Meta Llama
   - Mistral
   - Qwen
   - DeepSeek
   - xAI Grok

2. **Pollinations AI** (Fallback)
   - Text generation
   - Image generation (Flux)

3. **Custom API Keys** (Optional)
   - OpenRouter
   - Groq
   - Google AI Studio

### Smart Features

#### 🔄 Auto API Rotation
When one provider hits limits or fails:
```
Request → Provider 1 (fail) → Provider 2 (fail) → Provider 3 (success)
```

#### 💾 Response Caching
- Hash-based caching system
- Reduces API calls for repeated queries
- Configurable TTL (Time To Live)

#### ⚡ No Rate Limit Hits
- Automatic provider switching
- Request queuing
- Intelligent retry logic

## 📱 Installation

### Web App (Instant)
Just open `index.html` in your browser!

### PWA (Progressive Web App)
1. Open in Chrome/Edge
2. Click "Install" in address bar
3. Works offline!

### Android APK

#### Prerequisites
- Node.js 18+
- Android Studio
- Java JDK 17+

#### Build Steps
```bash
# Install dependencies
npm install

# Initialize Capacitor
npm run cap:init

# Add Android platform
npm run cap:add:android

# Copy web files
npm run copy-files

# Sync with Android
npm run cap:sync

# Build Debug APK
npm run build-android

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Quick Build (One Command)
```bash
npm run build
```

### iOS (Coming Soon)
```bash
npx cap add ios
npx cap open ios
```

## 🔧 Configuration

### Settings Panel
Access via ⚙️ icon in header:
- Primary Provider selection
- Auto-rotation toggle
- Response caching toggle
- Theme (Dark/Light/Auto)

### Custom API Keys
For power users who want to use their own API keys:
1. Open Settings
2. Select "Custom API Keys" as Primary Provider
3. Enter your keys:
   - OpenRouter: `sk-or-...`
   - Groq: `gsk_...`
   - Google AI: `AIza...`

## 🎯 Usage Examples

### Vibe Coding
```
"Create a Python script that scrapes weather data and saves to JSON"
```

### Image Generation
```
"A cyberpunk cityscape with neon lights, flying cars, and rain, 4K quality"
```

### Regex Generation
```
"Match all email addresses in a text"
→ Generates: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
```

### Code Debugging
```
"Debug this code: [paste your code]"
```

## 🏗️ Project Structure
```
vibe-ai-agent/
├── index.html          # Main HTML
├── styles.css          # All styles
├── app.js              # Main application logic
├── sw.js               # Service Worker (PWA)
├── manifest.json       # PWA manifest
├── capacitor.config.json  # Android config
├── package.json        # Dependencies
└── android/            # Android project (after cap add)
```

## 📊 API Providers Comparison

| Provider | Models | Rate Limit | Cost |
|----------|--------|------------|------|
| Puter.js | 200+ | Unlimited* | Free |
| Pollinations | Flux, GPT | High | Free |
| OpenRouter | 50+ free | Varies | Free tier |
| Google AI | Gemini | 100/day | Free tier |

*Uses "User-Pays" model - costs are handled by Puter infrastructure

## 🔒 Privacy & Security
- All API calls go through secure HTTPS
- No data stored on external servers
- Local caching only
- No tracking or analytics

## 🤝 Contributing
Contributions welcome! Please submit PRs for:
- New API providers
- Additional AI features
- Bug fixes
- Documentation

## 📄 License
MIT License - Free for personal and commercial use

## 🙏 Credits
- [Puter.js](https://puter.com) - Free AI API infrastructure
- [Pollinations](https://pollinations.ai) - Free image generation
- [OpenRouter](https://openrouter.ai) - Multi-model routing
- [Capacitor](https://capacitorjs.com) - Native app framework

---

**Made with ❤️ for the AI community**

*No API keys required. No rate limits. Just pure AI power.*
