import React from 'react';
import { Message } from '../types';
import { User, Sparkles } from 'lucide-react';

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
          isUser ? 'bg-sage-600 ml-3' : 'bg-white border border-sage-200 mr-3'
        }`}>
          {isUser ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-sage-500" />}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
          isUser 
            ? 'bg-sage-600 text-white rounded-tr-none' 
            : 'bg-white text-sage-900 border border-sage-100 rounded-tl-none'
        }`}>
          {message.text}
        </div>
      </div>
    </div>
  );
};