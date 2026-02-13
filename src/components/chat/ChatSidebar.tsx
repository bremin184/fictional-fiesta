import React, { useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    type: 'text' | 'system';
}

interface ChatSidebarProps {
    messages: ChatMessage[];
    newMessage: string;
    onNewMessageChange: (value: string) => void;
    onSendMessage: () => void;
    onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    messages,
    newMessage,
    onNewMessageChange,
    onSendMessage,
    onClose,
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <GlassPanel className="w-full lg:w-full lg:h-[calc(100vh-7rem)] flex flex-col border-l border-border/30 lg:border-l-border/50 animate-slide-in-right transition-opacity duration-300 ease-out">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Chat
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${msg.type === 'system'
                                ? 'text-center text-xs text-muted-foreground'
                                : `chat-bubble ${msg.senderId === 'me' ? 'sent' : 'received'}`
                            }`}
                    >
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                    <NeonButton onClick={onSendMessage} className="px-4">
                        <Send className="w-5 h-5" />
                    </NeonButton>
                </div>
            </div>
        </GlassPanel>
    );
};
