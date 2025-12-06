import React from 'react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1 items-center p-3 bg-white rounded-tl-2xl rounded-tr-2xl rounded-br-2xl w-fit shadow-sm border border-sage-100">
      <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div>
    </div>
  );
};