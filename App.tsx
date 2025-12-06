import React, { useState, useEffect, useRef } from 'react';
import { Message, FinancialData, ViewMode } from './types';
import { initializeChat, sendMessageToGemini } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { useAudioInput } from './hooks/useAudioInput';
import FinancialDashboard from './components/FinancialDashboard';
import { Send, Mic, MicOff, LayoutDashboard, MessageSquare } from 'lucide-react';

const INITIAL_DATA: FinancialData = {
  location: '',
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savings: 0,
  currency: 'USD',
  goals: [],
  budgetBreakdown: [],
  recommendations: []
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData>(INITIAL_DATA);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, setTranscript } = useAudioInput();

  // Initialize Chat and send welcome message
  useEffect(() => {
    const init = async () => {
      try {
        initializeChat();
        setIsLoading(true);
        // We trigger the first message from the system manually or just prompt the system to start
        // Sending an empty or system-prompt triggering message
        const welcome = await sendMessageToGemini("Hello, I'm ready to start my financial planning.", handleDataUpdate);
        setMessages([{
          id: 'welcome',
          role: 'model',
          text: welcome,
          timestamp: new Date()
        }]);
      } catch (e) {
        console.error("Failed to init chat", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setViewMode(ViewMode.CHAT);
      else setViewMode(ViewMode.SPLIT);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update input when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleDataUpdate = (newData: Partial<FinancialData>) => {
    setFinancialData(prev => ({
      ...prev,
      ...newData,
      // Merge array fields uniquely if needed, or overwrite. Overwriting is safer for updates.
      goals: newData.goals || prev.goals,
      budgetBreakdown: newData.budgetBreakdown || prev.budgetBreakdown,
      recommendations: newData.recommendations || prev.recommendations
    }));
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !transcript)) return;
    
    const textToSend = inputText || transcript;
    setInputText('');
    setTranscript('');
    if (isListening) stopListening();

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend, handleDataUpdate);
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full bg-sage-50 text-sage-900 font-sans">
      
      {/* Mobile Nav Toggle (if strictly mobile) */}
      {isMobile && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
           <button 
            onClick={() => setViewMode(viewMode === ViewMode.CHAT ? ViewMode.DASHBOARD : ViewMode.CHAT)}
            className="bg-sage-600 text-white p-4 rounded-full shadow-lg hover:bg-sage-700 transition-all"
           >
             {viewMode === ViewMode.CHAT ? <LayoutDashboard /> : <MessageSquare />}
           </button>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex w-full max-w-7xl mx-auto h-full md:p-6 gap-6">
        
        {/* Left Column: Chat */}
        <div className={`flex-1 flex flex-col bg-white md:rounded-3xl shadow-sm overflow-hidden transition-all duration-300 ${
          isMobile && viewMode === ViewMode.DASHBOARD ? 'hidden' : 'block'
        }`}>
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-sage-100 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                 <span className="text-xl">🪙</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-sage-800">Penny</h1>
                <p className="text-xs text-sage-500">Your Financial Friend</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-sage-50/30">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6">
                 <ThinkingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-white border-t border-sage-100">
            <div className="relative flex items-end gap-2 bg-sage-50 p-2 rounded-2xl border border-sage-200 focus-within:border-sage-400 focus-within:ring-1 focus-within:ring-sage-200 transition-all">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-xl transition-colors ${
                  isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-sage-200 text-sage-500'
                }`}
                title="Use Voice Input"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 max-h-32 text-sage-800 placeholder:text-sage-400"
                rows={1}
                style={{ minHeight: '44px' }}
              />

              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() && !transcript}
                className="p-3 bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-sage-300 mt-2">
              Penny helps with planning, not professional tax or legal advice.
            </p>
          </div>
        </div>

        {/* Right Column: Dashboard (Desktop) / Overlay (Mobile logic handled by visibility toggle above) */}
        <div className={`
            flex-1 md:max-w-md lg:max-w-lg transition-all duration-300
            ${isMobile ? (viewMode === ViewMode.DASHBOARD ? 'block h-full' : 'hidden') : 'block h-full'}
        `}>
          <FinancialDashboard data={financialData} />
        </div>

      </div>
    </div>
  );
}