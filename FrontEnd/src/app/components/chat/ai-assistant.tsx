import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/button';
 
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}
 
interface AIAssistantPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}
 
const WELCOME_MESSAGE: Message = {
  id: '1',
  text: "Welcome to the QMS Dashboard. I can help you understand your KPIs, identify trends in open cases, or guide you through creating a new quality event. What would you like to explore?",
  sender: 'assistant',
  timestamp: new Date(),
};
 
function generateResponse(userInput: string): string {
  const input = userInput.toLowerCase();
  if (input.includes('deviation') || input.includes('quality')) {
    return 'Based on your current QMS data, you have 127 total deviations with 18 open cases requiring action. The recurrence rate is 12.3%, and your CAPA effectiveness is at 87%. Would you like to explore any specific deviation or get recommendations for improvement?';
  } else if (input.includes('open case') || input.includes('active')) {
    return 'Currently, you have 18 open cases across your sites. The most critical issue is "Temperature excursion in Cold Storage Unit 3" which is under active investigation. Would you like details on other open cases?';
  } else if (input.includes('capa') || input.includes('corrective')) {
    return 'Your CAPA effectiveness rate is 87%, indicating strong follow-through on corrective actions. I can help you create a new CAPA, analyze patterns, or review implementation strategies. What would you like to focus on?';
  } else if (input.includes('trend') || input.includes('analyze')) {
    return 'Your data shows a 2.3% increase in deviations this month compared to last month, primarily in manufacturing. However, your CAPA effectiveness has improved by 5%. Would you like a detailed trend analysis?';
  } else if (input.includes('help') || input.includes('what can')) {
    return 'I can help you with:\n• Understanding your KPIs and metrics\n• Exploring critical issues and deviations\n• Creating and tracking CAPAs\n• Analyzing trends and patterns\n• Getting recommendations for improvements\n\nWhat would you like assistance with?';
  } else {
    return "I'm here to help you navigate the QMS. You can ask me about deviations, open cases, CAPA effectiveness, or any quality management topic.";
  }
}
 
export function AIAssistantPanel({ isOpen, onToggle }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(userMessage.text),
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 600);
  };
 
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
 
  return (
    <>
      {/* Inline right panel — shown when open */}
      {isOpen && (
        <div className="w-80 border-l border-border bg-background flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-foreground text-sm">AI Assistant</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
              aria-label="Close AI Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
 
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-muted text-foreground border border-border rounded-bl-none'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:100ms]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:200ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
 
          {/* Input */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || inputValue.trim() === ''}
                className="p-2 bg-transparent text-blue-500 hover:text-blue-600 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Floating button — only shown when panel is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Open AI Assistant"
          style={{ width: 52, height: 52 }}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
 
// Keep old export for backward compat
export { AIAssistantPanel as AIAssistant };
 