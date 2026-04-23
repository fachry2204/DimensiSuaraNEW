import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export const FloatingSupportBubble: React.FC<{ count?: number }> = ({ count = 0 }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate('/tickets')}
            className="fixed bottom-6 right-6 z-50 bg-white shadow-lg border border-gray-200 rounded-full px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all hover:scale-105 group"
        >
            <div className="relative w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <MessageCircle size={20} />
                {count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{count > 9 ? '9+' : count}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight">Ticket Support</span>
                <span className="text-[10px] text-gray-500 leading-tight group-hover:text-indigo-600">
                    {count > 0 ? `${count} New Reply` : 'Click Here'}
                </span>
            </div>
        </div>
    );
};
