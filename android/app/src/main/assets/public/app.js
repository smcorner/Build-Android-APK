/**
 * Vibe AI Agent - Complete JavaScript Application
 * Features: Multi-API rotation, caching, code generation, image gen, OCR, regex, file management
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
    version: '1.0.0',
    cacheTTL: 3600000, // 1 hour in ms
    maxRetries: 3,
    providers: {
        puter: { name: 'Puter.js', status: 'active', calls: 0, errors: 0 },
        pollinations: { name: 'Pollinations', status: 'active', calls: 0, errors: 0 },
        gemini: { name: 'Google AI', status: 'active', calls: 0, errors: 0 }
    }
};

// ==================== STATE MANAGEMENT ====================
const state = {
    currentTab: 'chat',
    chatHistory: [],
    conversationHistory: [],
    files: {
        'project': {
            type: 'folder',
            children: {
                'index.html': { type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>' },
                'style.css': { type: 'file', content: '/* Add your styles here */\nbody {\n    font-family: sans-serif;\n}' },
                'script.js': { type: 'file', content: '// Add your JavaScript here\nconsole.log("Hello!");' }
            }
        }
    },
    currentFile: null,
    generatedImages: [],
    apiCallCount: 0,
    cacheHits: 0,
    settings: {
        primaryProvider: 'puter',
        autoRotation: true,
        cacheEnabled: true,
        maxRetries: 3,
        theme: 'dark'
    }
};

// ==================== CACHE SYSTEM ====================
class ResponseCache {
    constructor() {
        this.cache = new Map();
        this.loadFromStorage();
    }

    generateHash(input) {
        let hash = 0;
        const str = JSON.stringify(input);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    get(key) {
        const hash = this.generateHash(key);
        const cached = this.cache.get(hash);
        if (cached && Date.now() - cached.timestamp < CONFIG.cacheTTL) {
            state.cacheHits++;
            updateStats();
            logDebug('Cache hit for request', 'success');
            return cached.data;
        }
        return null;
    }

    set(key, data) {
        const hash = this.generateHash(key);
        this.cache.set(hash, { data, timestamp: Date.now() });
        this.saveToStorage();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('vibeai_cache');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.cache = new Map(Object.entries(parsed));
            }
        } catch (e) {
            console.warn('Cache load failed:', e);
        }
    }

    saveToStorage() {
        try {
            const obj = Object.fromEntries(this.cache);
            localStorage.setItem('vibeai_cache', JSON.stringify(obj));
        } catch (e) {
            console.warn('Cache save failed:', e);
        }
    }

    clear() {
        this.cache.clear();
        localStorage.removeItem('vibeai_cache');
    }
}

const cache = new ResponseCache();

// ==================== API PROVIDER SYSTEM ====================
class APIProvider {
    constructor() {
        this.currentProvider = 'puter';
        this.fallbackOrder = ['puter', 'pollinations', 'gemini'];
    }

    async chat(prompt, options = {}) {
        const cacheKey = { prompt, model: options.model };
        
        if (state.settings.cacheEnabled) {
            const cached = cache.get(cacheKey);
            if (cached) return cached;
        }

        let lastError = null;
        const providers = state.settings.autoRotation ? this.fallbackOrder : [this.currentProvider];

        for (const provider of providers) {
            try {
                logDebug(`Trying ${provider}...`, 'info');
                const result = await this.callProvider(provider, prompt, options);
                
                if (result) {
                    CONFIG.providers[provider].calls++;
                    CONFIG.providers[provider].status = 'active';
                    state.apiCallCount++;
                    updateStats();
                    
                    if (state.settings.cacheEnabled) {
                        cache.set(cacheKey, result);
                    }
                    
                    return result;
                }
            } catch (error) {
                lastError = error;
                CONFIG.providers[provider].errors++;
                CONFIG.providers[provider].status = 'limited';
                logDebug(`${provider} failed: ${error.message}`, 'error');
                
                if (state.settings.autoRotation) {
                    logDebug('Rotating to next provider...', 'warning');
                    continue;
                }
            }
        }

        throw lastError || new Error('All providers failed');
    }

    async callProvider(provider, prompt, options) {
        const model = options.model || 'openrouter:google/gemini-2.0-flash-exp:free';
        
        switch (provider) {
            case 'puter':
                return await this.callPuter(prompt, model, options);
            case 'pollinations':
                return await this.callPollinations(prompt, options);
            case 'gemini':
                return await this.callGemini(prompt, options);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    async callPuter(prompt, model, options) {
        const messages = options.messages || [{ role: 'user', content: prompt }];
        
        if (options.stream) {
            const response = await puter.ai.chat(messages, {
                model: model,
                stream: true
            });
            return response;
        }
        
        const response = await puter.ai.chat(messages, { model });
        return response.message?.content || response;
    }

    async callPollinations(prompt, options) {
        const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
        if (!response.ok) throw new Error('Pollinations API error');
        return await response.text();
    }

    async callGemini(prompt, options) {
        // Uses Puter.js Gemini models as fallback
        return await this.callPuter(prompt, 'openrouter:google/gemini-2.0-flash-exp:free', options);
    }

    async generateImage(prompt, options = {}) {
        const model = options.model || 'stabilityai/stable-diffusion-3-medium';
        
        try {
            if (model === 'flux') {
                // Use Pollinations for Flux
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${options.width || 512}&height=${options.height || 512}`;
                return { url, provider: 'pollinations' };
            } else if (model === 'grok-2-image') {
                // Use Puter for Grok image
                const image = await puter.ai.txt2img({
                    prompt: prompt,
                    model: 'grok-2-image',
                    provider: 'xai'
                });
                return { element: image, provider: 'puter-grok' };
            } else {
                // Use Puter for Stable Diffusion
                const image = await puter.ai.txt2img(prompt, {
                    model: model,
                    width: options.width || 512,
                    height: options.height || 512,
                    negative_prompt: options.negativePrompt || ''
                });
                return { element: image, provider: 'puter-sd' };
            }
        } catch (error) {
            logDebug(`Image generation failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

const api = new APIProvider();

// ==================== UI FUNCTIONS ====================
function initApp() {
    // Hide splash after loading
    setTimeout(() => {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    }, 2500);

    // Load settings
    loadSettings();
    
    // Initialize components
    updateLineNumbers();
    updateFileTree();
    updateProviderStatus();
    
    // Auto-resize textarea
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
    });

    // Code editor line numbers
    const codeEditor = document.getElementById('codeEditor');
    codeEditor.addEventListener('input', updateLineNumbers);
    codeEditor.addEventListener('scroll', syncScroll);

    // Drag and drop for OCR
    setupDragDrop();

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log('SW registration failed'));
    }

    logDebug('Vibe AI Agent initialized successfully', 'success');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('closed');
    sidebar.classList.toggle('open');
}

function switchTab(tabName) {
    state.currentTab = tabName;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });

    // Mobile: close sidebar after selection
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    state.settings.primaryProvider = document.getElementById('primaryProvider').value;
    state.settings.autoRotation = document.getElementById('autoRotation').checked;
    state.settings.cacheEnabled = document.getElementById('cacheEnabled').checked;
    state.settings.maxRetries = parseInt(document.getElementById('maxRetries').value);
    state.settings.theme = document.getElementById('themeSelect').value;
    
    localStorage.setItem('vibeai_settings', JSON.stringify(state.settings));
    changeTheme();
    closeSettings();
    logDebug('Settings saved', 'success');
}

function loadSettings() {
    try {
        const stored = localStorage.getItem('vibeai_settings');
        if (stored) {
            state.settings = { ...state.settings, ...JSON.parse(stored) };
        }
        
        // Apply to UI
        document.getElementById('primaryProvider').value = state.settings.primaryProvider;
        document.getElementById('autoRotation').checked = state.settings.autoRotation;
        document.getElementById('cacheEnabled').checked = state.settings.cacheEnabled;
        document.getElementById('maxRetries').value = state.settings.maxRetries;
        document.getElementById('themeSelect').value = state.settings.theme;
        
        changeTheme();
    } catch (e) {
        console.warn('Settings load failed:', e);
    }
}

function changeTheme() {
    const theme = state.settings.theme;
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        // Auto - use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('light-theme', !prefersDark);
    }
}

function updateStats() {
    document.getElementById('apiCallCount').textContent = state.apiCallCount;
    document.getElementById('cacheHits').textContent = state.cacheHits;
}

function updateProviderStatus() {
    const container = document.getElementById('providerStatus');
    container.innerHTML = Object.entries(CONFIG.providers).map(([key, provider]) => `
        <div class="provider-item">
            <span>${provider.name}</span>
            <span>Calls: ${provider.calls} | Errors: ${provider.errors}</span>
            <span class="status ${provider.status}">${provider.status}</span>
        </div>
    `).join('');
}

// ==================== CHAT FUNCTIONS ====================
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const model = document.getElementById('chatModel').value;
    
    // Add user message
    addMessageToChat('user', message);
    input.value = '';
    input.style.height = 'auto';

    // Add to conversation history
    state.conversationHistory.push({ role: 'user', content: message });

    // Show typing indicator
    showTypingIndicator();

    try {
        // Stream response
        const response = await puter.ai.chat(state.conversationHistory, {
            model: model,
            stream: true
        });

        hideTypingIndicator();
        
        let fullResponse = '';
        const messageEl = addMessageToChat('assistant', '');
        const contentEl = messageEl.querySelector('.message-content');

        for await (const chunk of response) {
            if (chunk?.text) {
                fullResponse += chunk.text;
                contentEl.innerHTML = formatMessage(fullResponse);
            }
        }

        // Add to conversation history
        state.conversationHistory.push({ role: 'assistant', content: fullResponse });
        
        // Save to history
        saveConversationHistory();
        
        // Check for code blocks and add copy buttons
        addCopyButtons(messageEl);

    } catch (error) {
        hideTypingIndicator();
        addMessageToChat('assistant', `❌ Error: ${error.message}. Trying alternative provider...`);
        logDebug(`Chat error: ${error.message}`, 'error');
        
        // Try fallback
        try {
            const fallbackResponse = await api.chat(message, { model });
            addMessageToChat('assistant', formatMessage(fallbackResponse));
        } catch (e) {
            addMessageToChat('assistant', `❌ All providers failed. Please try again later.`);
        }
    }
}

function addMessageToChat(role, content) {
    const container = document.getElementById('chatMessages');
    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.innerHTML = `<div class="message-content">${formatMessage(content)}</div>`;
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
    
    return messageEl;
}

function formatMessage(text) {
    if (!text) return '';
    
    // Code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code><button class="copy-btn" onclick="copyCode(this)">Copy</button></pre>`;
    });
    
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function insertPrompt(text) {
    document.getElementById('chatInput').value = text;
    document.getElementById('chatInput').focus();
}

function clearChat() {
    state.conversationHistory = [];
    document.getElementById('chatMessages').innerHTML = `
        <div class="welcome-message">
            <h2>👋 Welcome to Vibe AI Agent!</h2>
            <p>Start a new conversation...</p>
        </div>
    `;
}

function saveConversationHistory() {
    const history = {
        id: Date.now(),
        title: state.conversationHistory[0]?.content?.substring(0, 50) || 'New Chat',
        messages: state.conversationHistory,
        timestamp: new Date().toISOString()
    };
    
    state.chatHistory.unshift(history);
    if (state.chatHistory.length > 50) state.chatHistory.pop();
    
    localStorage.setItem('vibeai_history', JSON.stringify(state.chatHistory));
    updateHistoryList();
}

function updateHistoryList() {
    const container = document.getElementById('historyList');
    if (state.chatHistory.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No conversation history yet</p>';
        return;
    }
    
    container.innerHTML = state.chatHistory.map(item => `
        <div class="history-item" onclick="loadConversation(${item.id})">
            <h4>${escapeHtml(item.title)}...</h4>
            <small>${new Date(item.timestamp).toLocaleString()}</small>
        </div>
    `).join('');
}

function loadConversation(id) {
    const conversation = state.chatHistory.find(c => c.id === id);
    if (conversation) {
        state.conversationHistory = conversation.messages;
        document.getElementById('chatMessages').innerHTML = '';
        conversation.messages.forEach(msg => {
            addMessageToChat(msg.role, msg.content);
        });
        switchTab('chat');
    }
}

function copyCode(btn) {
    const code = btn.previousElementSibling.textContent;
    navigator.clipboard.writeText(code);
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
}

function addCopyButtons(messageEl) {
    // Already added in formatMessage
}

// ==================== IMAGE GENERATION ====================
async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }

    const model = document.getElementById('imageModel').value;
    const width = parseInt(document.getElementById('imgWidth').value) || 512;
    const height = parseInt(document.getElementById('imgHeight').value) || 512;
    const negativePrompt = document.getElementById('negativePrompt').value.trim();

    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '<p class="placeholder-text">Generating image... This may take a moment.</p>';

    try {
        const result = await api.generateImage(prompt, { model, width, height, negativePrompt });
        
        gallery.innerHTML = '';
        
        if (result.url) {
            // Pollinations URL
            const img = document.createElement('img');
            img.src = result.url;
            img.alt = prompt;
            img.onclick = () => downloadImage(result.url, 'generated-image.png');
            gallery.appendChild(img);
        } else if (result.element) {
            // Puter element
            result.element.alt = prompt;
            result.element.onclick = () => downloadImageFromCanvas(result.element);
            gallery.appendChild(result.element);
        }

        state.generatedImages.push({ prompt, result, timestamp: Date.now() });
        logDebug(`Image generated successfully via ${result.provider}`, 'success');
        
    } catch (error) {
        gallery.innerHTML = `<p class="placeholder-text">❌ Error: ${error.message}</p>`;
        logDebug(`Image generation failed: ${error.message}`, 'error');
    }
}

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

function downloadImageFromCanvas(img) {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = 'generated-image.png';
    a.click();
}

// ==================== OCR FUNCTIONS ====================
function setupDragDrop() {
    const dropZone = document.getElementById('ocrDropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.style.borderColor = 'var(--primary)');
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.style.borderColor = 'var(--border)');
    });
    
    dropZone.addEventListener('drop', handleDrop);
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processOCRFile(files[0]);
    }
}

function handleOCRUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processOCRFile(file);
    }
}

async function processOCRFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    // Show preview
    const preview = document.getElementById('ocrPreview');
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="OCR Preview">`;
        
        document.getElementById('ocrText').value = 'Processing image with AI vision...';
        
        try {
            // Use AI vision for OCR
            const response = await puter.ai.chat([
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract ALL text from this image. Return only the extracted text, nothing else.' },
                        { type: 'image_url', image_url: { url: e.target.result } }
                    ]
                }
            ], {
                model: 'openrouter:google/gemini-2.0-flash-exp:free'
            });
            
            const text = response.message?.content || response;
            document.getElementById('ocrText').value = text;
            logDebug('OCR completed successfully', 'success');
            
        } catch (error) {
            document.getElementById('ocrText').value = `Error: ${error.message}`;
            logDebug(`OCR failed: ${error.message}`, 'error');
        }
    };
    
    reader.readAsDataURL(file);
}

function copyOCRText() {
    const text = document.getElementById('ocrText').value;
    navigator.clipboard.writeText(text);
    alert('Text copied to clipboard!');
}

function downloadOCRText() {
    const text = document.getElementById('ocrText').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== REGEX FUNCTIONS ====================
function testRegex() {
    const pattern = document.getElementById('regexPattern').value;
    const testString = document.getElementById('regexTestString').value;
    const matchesDiv = document.getElementById('regexMatches');
    
    if (!pattern) {
        matchesDiv.innerHTML = '<span style="color: var(--text-muted)">Enter a pattern to test</span>';
        return;
    }
    
    try {
        const flags = [
            document.getElementById('flagG').checked ? 'g' : '',
            document.getElementById('flagI').checked ? 'i' : '',
            document.getElementById('flagM').checked ? 'm' : ''
        ].join('');
        
        const regex = new RegExp(pattern, flags);
        const matches = testString.match(regex);
        
        if (matches) {
            matchesDiv.innerHTML = `
                <span style="color: var(--success)">Found ${matches.length} match(es):</span><br>
                ${matches.map((m, i) => `<span style="background: rgba(102, 126, 234, 0.3); padding: 2px 4px; margin: 2px; display: inline-block;">${i + 1}: "${m}"</span>`).join('')}
            `;
        } else {
            matchesDiv.innerHTML = '<span style="color: var(--warning)">No matches found</span>';
        }
    } catch (error) {
        matchesDiv.innerHTML = `<span style="color: var(--error)">Invalid regex: ${error.message}</span>`;
    }
}

async function generateRegex() {
    const description = document.getElementById('regexDescription').value.trim();
    if (!description) {
        alert('Please describe what you want to match');
        return;
    }
    
    try {
        const response = await api.chat(`Generate a JavaScript regular expression for the following requirement. Return ONLY the regex pattern without any explanation or code blocks. Just the pattern itself.

Requirement: ${description}`, {
            model: 'openrouter:google/gemini-2.0-flash-exp:free'
        });
        
        const pattern = response.replace(/^\/|\/[gimsuy]*$/g, '').trim();
        document.getElementById('regexPattern').value = pattern;
        testRegex();
        logDebug('Regex generated successfully', 'success');
        
    } catch (error) {
        alert(`Error generating regex: ${error.message}`);
        logDebug(`Regex generation failed: ${error.message}`, 'error');
    }
}

// ==================== CODE EDITOR FUNCTIONS ====================
function updateLineNumbers() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    const lines = editor.value.split('\n').length;
    
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
}

function syncScroll() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    lineNumbers.scrollTop = editor.scrollTop;
}

function changeLanguage() {
    const lang = document.getElementById('editorLanguage').value;
    logDebug(`Editor language changed to ${lang}`, 'info');
}

async function formatCode() {
    const code = document.getElementById('codeEditor').value;
    const lang = document.getElementById('editorLanguage').value;
    
    try {
        const response = await api.chat(`Format and beautify the following ${lang} code. Return ONLY the formatted code, nothing else:

${code}`, {
            model: 'openrouter:qwen/qwen-2.5-coder-32b-instruct:free'
        });
        
        document.getElementById('codeEditor').value = response.trim();
        updateLineNumbers();
        logDebug('Code formatted', 'success');
    } catch (error) {
        logDebug(`Format failed: ${error.message}`, 'error');
    }
}

async function aiFixCode() {
    const code = document.getElementById('codeEditor').value;
    const lang = document.getElementById('editorLanguage').value;
    
    try {
        const response = await api.chat(`Fix any bugs or issues in the following ${lang} code. Return ONLY the fixed code, nothing else:

${code}`, {
            model: 'openrouter:qwen/qwen-2.5-coder-32b-instruct:free'
        });
        
        document.getElementById('codeEditor').value = response.trim();
        updateLineNumbers();
        logDebug('Code fixed by AI', 'success');
    } catch (error) {
        logDebug(`AI fix failed: ${error.message}`, 'error');
    }
}

function runCode() {
    const code = document.getElementById('codeEditor').value;
    const lang = document.getElementById('editorLanguage').value;
    const output = document.getElementById('outputContent');
    
    if (lang === 'javascript') {
        try {
            // Capture console.log output
            const logs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' '));
            };
            
            // Execute code
            const result = eval(code);
            
            console.log = originalLog;
            
            output.textContent = logs.join('\n') + (result !== undefined ? '\n→ ' + JSON.stringify(result, null, 2) : '');
            logDebug('Code executed successfully', 'success');
        } catch (error) {
            output.textContent = `Error: ${error.message}`;
            logDebug(`Execution error: ${error.message}`, 'error');
        }
    } else if (lang === 'html') {
        refreshPreview();
        switchTab('preview');
    } else {
        output.textContent = `Direct execution not supported for ${lang}. Use Preview for HTML/CSS/JS.`;
    }
}

function clearOutput() {
    document.getElementById('outputContent').textContent = '';
}

function saveFile() {
    if (state.currentFile) {
        const path = state.currentFile.split('/');
        let current = state.files;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]].children;
        }
        current[path[path.length - 1]].content = document.getElementById('codeEditor').value;
        logDebug(`File saved: ${state.currentFile}`, 'success');
    } else {
        alert('No file selected. Use Files tab to manage files.');
    }
}

function downloadCode() {
    const code = document.getElementById('codeEditor').value;
    const lang = document.getElementById('editorLanguage').value;
    const extensions = {
        javascript: 'js', python: 'py', html: 'html', css: 'css',
        json: 'json', typescript: 'ts', java: 'java', cpp: 'cpp', rust: 'rs', go: 'go'
    };
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extensions[lang] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== PREVIEW FUNCTIONS ====================
function refreshPreview() {
    const frame = document.getElementById('previewFrame');
    const code = document.getElementById('codeEditor').value;
    const lang = document.getElementById('editorLanguage').value;
    
    let html = code;
    
    if (lang !== 'html') {
        // Wrap non-HTML code
        if (lang === 'javascript') {
            html = `<!DOCTYPE html><html><body><script>${code}<\/script></body></html>`;
        } else if (lang === 'css') {
            html = `<!DOCTYPE html><html><head><style>${code}</style></head><body><h1>CSS Preview</h1><p>Your styles are applied to this page.</p></body></html>`;
        } else {
            html = `<!DOCTYPE html><html><body><pre>${escapeHtml(code)}</pre></body></html>`;
        }
    }
    
    frame.srcdoc = html;
}

function setPreviewSize(device) {
    const frame = document.getElementById('previewFrame');
    const buttons = document.querySelectorAll('.device-buttons button');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('button').classList.add('active');
    
    switch (device) {
        case 'desktop':
            frame.style.width = '100%';
            frame.style.height = '100%';
            break;
        case 'tablet':
            frame.style.width = '768px';
            frame.style.height = '100%';
            break;
        case 'mobile':
            frame.style.width = '375px';
            frame.style.height = '100%';
            break;
    }
}

// ==================== FILE MANAGEMENT ====================
function updateFileTree() {
    const container = document.getElementById('fileTree');
    container.innerHTML = renderFileTree(state.files, '');
}

function renderFileTree(files, path) {
    return Object.entries(files).map(([name, item]) => {
        const fullPath = path ? `${path}/${name}` : name;
        
        if (item.type === 'folder') {
            return `
                <div class="folder-item">
                    <div class="file-item" onclick="toggleFolder(this)">
                        <i class="fas fa-folder"></i>
                        <span>${name}</span>
                    </div>
                    <div class="folder-children" style="padding-left: 1rem;">
                        ${renderFileTree(item.children, fullPath)}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="file-item" onclick="openFile('${fullPath}')">
                    <i class="fas fa-file-code"></i>
                    <span>${name}</span>
                </div>
            `;
        }
    }).join('');
}

function toggleFolder(element) {
    const children = element.nextElementSibling;
    if (children) {
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
        const icon = element.querySelector('i');
        icon.classList.toggle('fa-folder');
        icon.classList.toggle('fa-folder-open');
    }
}

function openFile(path) {
    const parts = path.split('/');
    let current = state.files;
    
    for (const part of parts) {
        if (current[part]) {
            if (current[part].type === 'folder') {
                current = current[part].children;
            } else {
                state.currentFile = path;
                document.getElementById('codeEditor').value = current[part].content;
                
                // Set language based on extension
                const ext = part.split('.').pop();
                const langMap = { js: 'javascript', py: 'python', html: 'html', css: 'css', json: 'json', ts: 'typescript' };
                if (langMap[ext]) {
                    document.getElementById('editorLanguage').value = langMap[ext];
                }
                
                updateLineNumbers();
                switchTab('editor');
                logDebug(`Opened: ${path}`, 'info');
                return;
            }
        }
    }
}

function createNewFile() {
    const name = prompt('Enter file name (e.g., app.js):');
    if (name) {
        state.files.project.children[name] = { type: 'file', content: '' };
        updateFileTree();
        openFile(`project/${name}`);
    }
}

function createNewFolder() {
    const name = prompt('Enter folder name:');
    if (name) {
        state.files.project.children[name] = { type: 'folder', children: {} };
        updateFileTree();
    }
}

function importFile() {
    document.getElementById('importFileInput').click();
}

function handleImportFiles(event) {
    const files = event.target.files;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.files.project.children[file.name] = {
                type: 'file',
                content: e.target.result
            };
            updateFileTree();
            logDebug(`Imported: ${file.name}`, 'success');
        };
        reader.readAsText(file);
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('chatInput').value += `\n\nFile content (${file.name}):\n${e.target.result}`;
        };
        reader.readAsText(file);
    }
}

// ==================== DEBUG FUNCTIONS ====================
function logDebug(message, type = 'info') {
    const log = document.getElementById('debugLog');
    const timestamp = new Date().toLocaleTimeString();
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="message">${message}</span>`;
    
    log.appendChild(entry);
    
    if (document.getElementById('autoScroll')?.checked) {
        log.scrollTop = log.scrollHeight;
    }
    
    updateProviderStatus();
}

function clearDebugLog() {
    document.getElementById('debugLog').innerHTML = '';
    logDebug('Debug log cleared', 'info');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', initApp);

// Load history on start
try {
    const savedHistory = localStorage.getItem('vibeai_history');
    if (savedHistory) {
        state.chatHistory = JSON.parse(savedHistory);
        updateHistoryList();
    }
} catch (e) {
    console.warn('History load failed:', e);
}

// Export for global access
window.toggleSidebar = toggleSidebar;
window.switchTab = switchTab;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.sendMessage = sendMessage;
window.handleChatKeydown = handleChatKeydown;
window.insertPrompt = insertPrompt;
window.clearChat = clearChat;
window.generateImage = generateImage;
window.handleOCRUpload = handleOCRUpload;
window.copyOCRText = copyOCRText;
window.downloadOCRText = downloadOCRText;
window.testRegex = testRegex;
window.generateRegex = generateRegex;
window.formatCode = formatCode;
window.aiFixCode = aiFixCode;
window.runCode = runCode;
window.clearOutput = clearOutput;
window.saveFile = saveFile;
window.downloadCode = downloadCode;
window.refreshPreview = refreshPreview;
window.setPreviewSize = setPreviewSize;
window.createNewFile = createNewFile;
window.createNewFolder = createNewFolder;
window.importFile = importFile;
window.handleImportFiles = handleImportFiles;
window.handleFileUpload = handleFileUpload;
window.clearDebugLog = clearDebugLog;
window.changeLanguage = changeLanguage;
window.changeTheme = changeTheme;
window.toggleFolder = toggleFolder;
window.openFile = openFile;
window.loadConversation = loadConversation;
window.copyCode = copyCode;
