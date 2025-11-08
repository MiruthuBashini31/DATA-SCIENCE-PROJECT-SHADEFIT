// AI Beauty Assistant Chat Interface
class ChatAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatInterface();
        this.setupEventListeners();
        this.loadChatHistory();
    }

    createChatInterface() {
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.innerHTML = `
            <div class="chat-toggle" id="chat-toggle">
                <i class="fas fa-comments"></i>
                <span class="chat-badge" id="chat-badge">AI</span>
            </div>
            
            <div class="chat-window" id="chat-window" style="display: none;">
                <div class="chat-header">
                    <div class="chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="chat-info">
                        <h4>Beauty Assistant</h4>
                        <span class="chat-status">Online</span>
                    </div>
                    <button class="chat-close" id="chat-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    <div class="message bot-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <p>Hi! I'm your AI beauty assistant. I can help you with:</p>
                            <div class="quick-suggestions">
                                <button class="suggestion-btn" data-message="What foundation shade should I use?">Foundation matching</button>
                                <button class="suggestion-btn" data-message="Give me makeup tips for beginners">Makeup tips</button>
                                <button class="suggestion-btn" data-message="How do I find my undertone?">Undertone help</button>
                                <button class="suggestion-btn" data-message="Recommend products for Indian skin">Product recommendations</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <div class="typing-indicator" id="typing-indicator" style="display: none;">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>Assistant is typing...</span>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="chat-input" placeholder="Ask me anything about beauty..." maxlength="500">
                        <button id="chat-send" disabled>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(chatContainer);
    }

    setupEventListeners() {
        const toggle = document.getElementById('chat-toggle');
        const close = document.getElementById('chat-close');
        const input = document.getElementById('chat-input');
        const send = document.getElementById('chat-send');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        
        input.addEventListener('input', (e) => {
            const sendBtn = document.getElementById('chat-send');
            sendBtn.disabled = e.target.value.trim().length === 0;
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        send.addEventListener('click', () => this.sendMessage());

        // Quick suggestions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                const message = e.target.dataset.message;
                this.sendMessage(message);
            }
        });
    }

    toggleChat() {
        const window = document.getElementById('chat-window');
        const badge = document.getElementById('chat-badge');
        
        if (this.isOpen) {
            this.closeChat();
        } else {
            window.style.display = 'block';
            window.classList.add('chat-open');
            badge.style.display = 'none';
            this.isOpen = true;
            
            // Focus input
            setTimeout(() => {
                document.getElementById('chat-input').focus();
            }, 300);
        }
    }

    closeChat() {
        const window = document.getElementById('chat-window');
        const badge = document.getElementById('chat-badge');
        
        window.classList.remove('chat-open');
        setTimeout(() => {
            window.style.display = 'none';
        }, 300);
        
        badge.style.display = 'block';
        this.isOpen = false;
    }

    async sendMessage(messageText = null) {
        const input = document.getElementById('chat-input');
        const message = messageText || input.value.trim();
        
        if (!message) return;

        // Clear input
        input.value = '';
        document.getElementById('chat-send').disabled = true;

        // Add user message
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTyping();

        try {
            // Send to backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTyping();
            
            // Add bot response
            setTimeout(() => {
                this.addMessage(data.response, 'bot');
                this.addQuickSuggestions(message);
            }, 500);

        } catch (error) {
            this.hideTyping();
            this.addMessage('Sorry, I\'m having trouble connecting. Please try again.', 'bot');
        }

        // Save to history
        this.saveChatHistory();
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
                <span class="message-time">${timestamp}</span>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to messages array
        this.messages.push({ content, sender, timestamp });
    }

    addQuickSuggestions(lastMessage) {
        const suggestions = this.getContextualSuggestions(lastMessage);
        if (suggestions.length === 0) return;

        const messagesContainer = document.getElementById('chat-messages');
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'message bot-message suggestions-message';
        
        suggestionsDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="message-content">
                <p>You might also want to ask:</p>
                <div class="quick-suggestions">
                    ${suggestions.map(suggestion => 
                        `<button class="suggestion-btn" data-message="${suggestion}">${suggestion}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        messagesContainer.appendChild(suggestionsDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getContextualSuggestions(lastMessage) {
        const message = lastMessage.toLowerCase();
        
        if (message.includes('foundation')) {
            return [
                'How do I apply foundation properly?',
                'What\'s the difference between coverage types?',
                'Should I use primer with foundation?'
            ];
        }
        
        if (message.includes('undertone')) {
            return [
                'What colors suit my undertone?',
                'How do undertones affect clothing choices?',
                'Can undertones change over time?'
            ];
        }
        
        if (message.includes('lipstick')) {
            return [
                'How to make lipstick last longer?',
                'What lip colors are trending?',
                'How to choose lip liner?'
            ];
        }
        
        if (message.includes('skincare')) {
            return [
                'What\'s a good morning routine?',
                'How often should I exfoliate?',
                'What ingredients should I avoid?'
            ];
        }

        // Default suggestions
        return [
            'Show me trending makeup looks',
            'Help me build a makeup routine',
            'What\'s new in beauty?'
        ];
    }

    showTyping() {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = 'flex';
        
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = 'none';
    }

    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(this.messages.slice(-20))); // Keep last 20 messages
    }

    loadChatHistory() {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            this.messages = JSON.parse(history);
            // Optionally restore messages to UI
        }
    }

    // Public method to send contextual messages
    sendContextualMessage(context, skinAnalysis = null) {
        let message = '';
        
        switch (context) {
            case 'analysis_complete':
                message = `I just completed my skin analysis and got ${skinAnalysis.category} with ${skinAnalysis.undertone} undertone. What products do you recommend?`;
                break;
            case 'product_view':
                message = 'I\'m looking at beauty products. Can you help me choose the right shades?';
                break;
            case 'clothing_help':
                message = 'What clothing colors would look good with my skin tone?';
                break;
        }
        
        if (message) {
            this.toggleChat();
            setTimeout(() => this.sendMessage(message), 500);
        }
    }
}

// CSS Styles for Chat Interface
const chatStyles = `
<style>
.chat-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
}

.chat-toggle {
    width: 60px;
    height: 60px;
    background: var(--primary-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-hover);
    transition: var(--transition);
    position: relative;
}

.chat-toggle:hover {
    transform: scale(1.1);
}

.chat-toggle i {
    color: white;
    font-size: 1.5rem;
}

.chat-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--error-red);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 0.7rem;
    font-weight: 600;
}

.chat-window {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-hover);
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    transform: translateY(20px) scale(0.9);
    opacity: 0;
    transition: all 0.3s ease;
}

.chat-window.chat-open {
    transform: translateY(0) scale(1);
    opacity: 1;
}

.chat-header {
    padding: 1rem;
    background: var(--primary-gradient);
    color: white;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.chat-avatar {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-info {
    flex: 1;
}

.chat-info h4 {
    margin: 0;
    font-size: 1rem;
}

.chat-status {
    font-size: 0.8rem;
    opacity: 0.9;
}

.chat-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: var(--transition);
}

.chat-close:hover {
    background: rgba(255,255,255,0.2);
}

.chat-messages {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.message {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.user-message {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.bot-message .message-avatar {
    background: var(--accent-gradient);
    color: white;
}

.user-message .message-avatar {
    background: var(--secondary-gradient);
    color: white;
}

.message-content {
    max-width: 80%;
    background: var(--input-bg);
    padding: 0.8rem;
    border-radius: 12px;
    position: relative;
}

.user-message .message-content {
    background: var(--primary-gradient);
    color: white;
}

.message-content p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
}

.message-time {
    font-size: 0.7rem;
    opacity: 0.7;
    display: block;
    margin-top: 0.3rem;
}

.quick-suggestions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.8rem;
}

.suggestion-btn {
    background: white;
    border: 1px solid var(--border-color);
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    cursor: pointer;
    transition: var(--transition);
    font-size: 0.8rem;
    text-align: left;
}

.suggestion-btn:hover {
    background: var(--light-hover);
    border-color: var(--accent-purple);
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    color: var(--text-muted);
    font-size: 0.8rem;
}

.typing-dots {
    display: flex;
    gap: 2px;
}

.typing-dots span {
    width: 4px;
    height: 4px;
    background: var(--accent-purple);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-10px);
    }
}

.chat-input-container {
    border-top: 1px solid var(--border-color);
}

.chat-input {
    display: flex;
    padding: 1rem;
    gap: 0.5rem;
    align-items: center;
}

.chat-input input {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
    outline: none;
    transition: var(--transition);
}

.chat-input input:focus {
    border-color: var(--accent-purple);
}

.chat-input button {
    width: 40px;
    height: 40px;
    background: var(--primary-gradient);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-input button:disabled {
    background: var(--text-muted);
    cursor: not-allowed;
}

.chat-input button:not(:disabled):hover {
    transform: scale(1.1);
}

@media (max-width: 768px) {
    .chat-window {
        width: 300px;
        height: 400px;
    }
    
    .chat-container {
        bottom: 10px;
        right: 10px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', chatStyles);

// Initialize chat assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatAssistant = new ChatAssistant();
});