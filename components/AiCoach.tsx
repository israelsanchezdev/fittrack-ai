import React, { useState, useRef, useEffect } from 'react';
import { AiChatMessage, Workout } from '../types';
import { Button } from './Button';
import { Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';
import { generateWorkoutPlan, analyzeWorkoutHistory } from '../services/geminiService';

interface AiCoachProps {
  workouts: Workout[];
}

export const AiCoach: React.FC<AiCoachProps> = ({ workouts }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: 'model', text: "Hi! I'm your AI fitness coach. I can create workout plans or analyze your history. What's your goal today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // Determine intent (simple keyword match for demo, usually done by LLM)
    const lowerInput = userMsg.toLowerCase();
    let responseText = "";

    if (lowerInput.includes('analyze') || lowerInput.includes('history') || lowerInput.includes('progress')) {
      responseText = await analyzeWorkoutHistory(workouts);
    } else {
      responseText = await generateWorkoutPlan(userMsg);
    }

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestionChips = [
    "Generate a 30-min HIIT workout",
    "Analyze my workout volume",
    "Plan a heavy leg day",
    "Core workout for beginners"
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-3 bg-gray-900/50 rounded-t-xl">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white">Gemini Coach</h2>
          <p className="text-xs text-indigo-300">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-600' : 'bg-indigo-600'}`}>
              {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-gray-700 text-gray-100 rounded-tl-none border border-gray-600 prose prose-invert prose-sm'
            }`}>
              {msg.role === 'model' ? (
                 <div dangerouslySetInnerHTML={{ 
                   __html: msg.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Basic bold parsing
                    .replace(/\n/g, '<br />') 
                 }} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center">
               <Bot className="w-4 h-4 text-white" />
             </div>
             <div className="bg-gray-700 px-4 py-3 rounded-xl rounded-tl-none border border-gray-600">
               <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-xl">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestionChips.map(chip => (
              <button 
                key={chip}
                onClick={() => { setInput(chip); }}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-indigo-300 px-3 py-1 rounded-full border border-gray-600 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a workout plan or analysis..."
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-12 custom-scrollbar"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 flex items-center justify-center !p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
