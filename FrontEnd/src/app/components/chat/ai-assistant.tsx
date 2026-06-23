import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome to the QMS Dashboard. I can help you understand your quality metrics, identify trends in your deviations, guide you through creating corrective actions, and answer any questions about your quality management system. What would you like to explore?",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate API call - replace with your actual API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(inputValue),
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('deviation') || input.includes('quality')) {
      return 'Based on your current QMS data, you have 127 total deviations with 18 open cases requiring action. The recurrence rate is 12.3%, and your CAPA effectiveness is at 87%. Would you like to explore any specific deviation or get recommendations for improvement?';
    } else if (input.includes('open case') || input.includes('active')) {
      return 'Currently, you have 18 open cases across your sites. The most critical issue is "Temperature excursion in Cold Storage Unit 3" which has been open for 8 days. I recommend immediate investigation. Would you like details on other open cases?';
    } else if (input.includes('capa') || input.includes('corrective')) {
      return 'Your CAPA effectiveness rate is 87%, which indicates closed deviations verified with continued effectiveness. I can help you create a new CAPA, analyze patterns, or review implementation strategies. What would you like to focus on?';
    } else if (input.includes('trend') || input.includes('analyze')) {
      return 'Your data shows a 2.3% increase in deviations this month compared to last month, primarily in manufacturing. However, your CAPA effectiveness has improved by 5%. Would you like a detailed trend analysis or recommendations for specific areas?';
    } else if (input.includes('help') || input.includes('what can')) {
      return 'I can help you with:\n• Understanding your KPIs and metrics\n• Exploring critical issues and deviations\n• Creating and tracking CAPAs\n• Analyzing trends and patterns\n• Getting recommendations for improvements\n• Answering QMS-related questions\n\nWhat would you like assistance with?';
    } else {
      return 'I\'m your AI assistant.';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      {isOpen && (
        <div className="w-[350px] h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition-all"
              aria-label="Close chat"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || inputValue.trim() === ''}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={onToggle}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all duration-200 active:scale-95 group"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-3 h-3" />
        ) : (
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        )}
      </button>
    </div>
  );
}