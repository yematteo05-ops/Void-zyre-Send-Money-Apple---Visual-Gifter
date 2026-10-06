import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';

interface SpecialistChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBuyModal?: (modelId: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'specialist',
    text: "Hello! I'm an Apple Specialist. Whether you need help choosing between iPhone 18 Pro, iPhone Air, or iPhone 17, evaluating your trade-in, or exploring Apple Intelligence, I'm here to assist!",
    timestamp: 'Just now',
    suggestions: [
      'Compare iPhone 18 Pro vs iPhone Air',
      'What is Apple Intelligence?',
      'How does Apple Trade In work?',
      'Which iPhone has the best battery life?'
    ]
  }
];

export const SpecialistChat: React.FC<SpecialistChatProps> = ({ isOpen, onClose, onOpenBuyModal }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I'd be glad to help you with that! Apple offers remarkable options across our iPhone lineup to match your workflow and budget.";
      let suggestions: string[] = ['Tell me about camera features', 'Check carrier deals'];

      const lower = query.toLowerCase();
      if (lower.includes('18 pro') || lower.includes('pro') || lower.includes('air')) {
        reply = "iPhone 18 Pro is engineered for extreme performance with the A20 Pro chip, a 48MP Triple-Fusion camera with 5x Telephoto, and up to 33 hours of battery life. In contrast, the revolutionary iPhone Air prioritizes an impossibly thin and lightweight design without compromising on Apple Intelligence and Pro-level speed!";
        suggestions = ['Buy iPhone 18 Pro', 'Buy iPhone Air', 'Compare full specs'];
      } else if (lower.includes('intelligence') || lower.includes('ai')) {
        reply = "Apple Intelligence is seamlessly built into iPhone 18 Pro, iPhone Air, iPhone 17, and iPhone 16! It enables private generative Siri, intelligent photo editing tools, priority summaries, and Image Playground — all while protecting your data with on-device processing and Private Cloud Compute.";
        suggestions = ['Which devices support it?', 'See iPhone 17'];
      } else if (lower.includes('trade') || lower.includes('credit') || lower.includes('save')) {
        reply = "With Apple Trade In, you can receive $120 to $650 in instant credit toward any new iPhone when you trade in iPhone 11 or newer. We'll send you a prepaid trade-in kit or you can complete it instantly in any Apple Store!";
        suggestions = ['Estimate trade-in value', 'See financing options'];
      } else if (lower.includes('battery')) {
        reply = "iPhone 18 Pro Max delivers our longest battery life ever — up to 33 hours of video playback. iPhone 18 Pro provides up to 27 hours, iPhone Air up to 27 hours, and iPhone 17 up to 26 hours.";
        suggestions = ['Buy iPhone 18 Pro', 'See iPhone 17'];
      } else if (lower.includes('camera') || lower.includes('photo')) {
        reply = "iPhone 18 Pro features 48MP Fusion, 48MP Ultra Wide, and 48MP 5x Telephoto lenses with next-gen Camera Control, 4K 120 fps Dolby Vision, and studio-quality spatial audio recording.";
        suggestions = ['Explore Pro specs', 'Buy iPhone 18 Pro'];
      }

      const specialistMsg: ChatMessage = {
        id: `s-${Date.now()}`,
        sender: 'specialist',
        text: reply,
        timestamp: 'Just now',
        suggestions
      };

      setMessages((prev) => [...prev, specialistMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-500 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] w-full max-w-md h-full shadow-2xl flex flex-col relative border-l border-black/10 dark:border-white/10 animate-slideLeft">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#0071e3]">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#34c759] border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-sm">Apple Specialist</h3>
              <p className="text-[11px] text-[#86868b] flex items-center gap-1">
                <span>Online & Ready to Help</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[#1d1d1f] dark:text-white"
            aria-label="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat message history */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-[#0071e3] text-white rounded-br-none shadow-sm'
                    : 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-bl-none shadow-sm border border-black/5 dark:border-white/5'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
                <span className="text-[10px] opacity-60 block mt-1 text-right">{m.timestamp}</span>
              </div>

              {/* Suggestions chips */}
              {m.suggestions && (
                <div className="flex flex-wrap gap-1.5 mt-1 max-w-[90%]">
                  {m.suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => {
                        if (sug.startsWith('Buy ') && onOpenBuyModal) {
                          const model = sug.toLowerCase().includes('18 pro') ? 'iphone-18-pro' : sug.toLowerCase().includes('air') ? 'iphone-air' : 'iphone-17';
                          onOpenBuyModal(model);
                          onClose();
                        } else {
                          handleSendMessage(sug);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full bg-white dark:bg-[#2c2c2e] hover:bg-[#0071e3]/10 dark:hover:bg-[#0071e3]/20 border border-black/10 dark:border-white/10 text-xs font-medium text-[#0071e3] transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-[#2c2c2e] w-16 text-[#86868b] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#86868b] animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-[#86868b] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#86868b] animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-[#2c2c2e] border-t border-black/5 dark:border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an Apple Specialist..."
              className="flex-1 px-4 py-2.5 rounded-full bg-[#f5f5f7] dark:bg-[#1c1c1e] text-sm outline-none border border-black/10 dark:border-white/10 focus:border-[#0071e3]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-[#0071e3] disabled:opacity-40 text-white flex items-center justify-center hover:bg-[#0077ed] transition-all shadow-md shadow-blue-500/20"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
