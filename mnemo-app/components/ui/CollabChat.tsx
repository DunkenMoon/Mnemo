"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/lib/collaboration";

interface Message {
  id: string;
  userId: string;
  userName: string;
  color: string;
  text: string;
  timestamp: number;
}

interface Props {
  documentId: string;
  currentUser: { id: string; name: string };
  myColor: string;
  collaboratorCount: number;
}

export function CollabChat({ documentId, currentUser, myColor, collaboratorCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase.channel(`chat:${documentId}`);

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => {
          const newMessages = [...prev, payload as Message];
          if (newMessages.length > 50) return newMessages.slice(newMessages.length - 50);
          return newMessages;
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const msg: Message = {
      id: Math.random().toString(36).substring(7),
      userId: currentUser.id,
      userName: currentUser.name,
      color: myColor,
      text: inputValue.trim(),
      timestamp: Date.now()
    };
    
    // Optimistic update
    setMessages(prev => [...prev, msg].slice(-50));
    setInputValue("");
    
    await channelRef.current?.send({
      type: "broadcast",
      event: "message",
      payload: msg
    });
  };

  return (
    <div className="fixed bottom-6 left-6 z-30 flex flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-72 bg-[#0A0A1F]/95 backdrop-blur border border-[#1E1E3F] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="bg-[#0F0F2E] p-3 border-b border-[#1E1E3F] flex justify-between items-center">
              <span className="text-xs font-bold text-[#F0F0FF] uppercase tracking-wider">Study Session</span>
              <span className="text-xs font-mono text-[#6BCB77] bg-[#6BCB77]/10 px-2 py-0.5 rounded-full">{collaboratorCount + 1} online</span>
            </div>
            
            <div className="flex-1 max-h-64 min-h-48 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                  <MessageCircle size={24} className="text-[#8888AA]" />
                  <p className="text-xs text-[#8888AA]">Study session started.<br/>Say something.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex flex-col">
                    <span className="text-[10px] font-bold mb-0.5" style={{ color: msg.color }}>
                      {msg.userName} {msg.userId === currentUser.id && "(You)"}
                    </span>
                    <span className="text-xs text-[#F0F0FF] leading-snug">{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-[#1E1E3F] bg-[#050510]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#0F0F2E] border border-[#1E1E3F] rounded-lg px-3 py-2 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6C63FF] transition-colors"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="p-2 bg-[#6C63FF] hover:bg-[#A78BFA] disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-[#0A0A1F]/90 backdrop-blur-xl border border-[#1E1E3F] hover:border-[#6C63FF] px-4 py-3 rounded-full flex items-center gap-3 transition-colors shadow-lg"
      >
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-[#00D4FF] flex items-center justify-center border-2 border-[#0A0A1F] z-20">
            <Users size={12} className="text-[#0A0A1F]" />
          </div>
          {collaboratorCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-[#6BCB77] flex items-center justify-center border-2 border-[#0A0A1F] z-10">
              <span className="text-[10px] font-bold text-[#0A0A1F]">+{collaboratorCount}</span>
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-[#F0F0FF]">
          {collaboratorCount + 1} studying
        </span>
      </motion.button>
    </div>
  );
}
