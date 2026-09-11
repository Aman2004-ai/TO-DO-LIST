import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  type ChatMessage,
  type ChatRoleKey,
  type TaskItem,
} from '../types';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Brain,
  Trash2,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings2,
  CheckSquare,
} from 'lucide-react';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onAddTaskFromChat?: (title: string) => void;
}

interface RoleOption {
  key: ChatRoleKey;
  name: string;
  model: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultInstruction: string;
}

const ROLES: RoleOption[] = [
  {
    key: 'general',
    name: 'General Assistant',
    model: 'gemini-3.5-flash',
    badge: 'General Tasks',
    icon: Sparkles,
    description: 'Helpful advice for scheduling, daily task prioritization, and motivation.',
    defaultInstruction:
      'You are TaskVault’s friendly and proactive productivity assistant. You help users manage their personal and collaborative to-do lists, prioritize tasks, suggest smart schedules, and break large goals into small, manageable items. Keep answers clear, structured, and motivational.',
  },
  {
    key: 'fast',
    name: 'Fast Organizer',
    model: 'gemini-3.1-flash-lite',
    badge: 'Fast Tasks',
    icon: Zap,
    description: 'High-speed instant categorizer and concise bullet-list generator.',
    defaultInstruction:
      'You are a high-speed task categorizer and organizer. Respond with rapid, concise bullet points, direct classifications (Priority, Category, Estimated Time), and minimal filler words. Focus purely on immediate speed and utility.',
  },
  {
    key: 'complex',
    name: 'Strategic Planner',
    model: 'gemini-3.1-pro-preview',
    badge: 'Complex Tasks',
    icon: Brain,
    description: 'In-depth breakdown of multi-phase projects, risk analysis, and milestones.',
    defaultInstruction:
      'You are a senior strategic advisor and project architect. When analyzing complex tasks and multi-phase goals, provide comprehensive deep-dive planning: identify critical path dependencies, risk assessments, phased execution timelines, and rigorous priority matrices.',
  },
];

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTaskFromChat,
}) => {
  const [selectedRoleKey, setSelectedRoleKey] = useState<ChatRoleKey>('general');
  const [includeTaskContext, setIncludeTaskContext] = useState(true);
  const [showSystemInstruction, setShowSystemInstruction] = useState(false);
  const [customInstructions, setCustomInstructions] = useState<Record<ChatRoleKey, string>>({
    general: ROLES[0].defaultInstruction,
    fast: ROLES[1].defaultInstruction,
    complex: ROLES[2].defaultInstruction,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-message',
      role: 'model',
      content:
        'Hello! I am your AI Task & Productivity Copilot. Ask me to help prioritize your tasks, break down complex projects, or brainstorm next steps.',
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentRole = ROLES.find((r) => r.key === selectedRoleKey) || ROLES[0];

  // Auto-scroll to bottom of thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Prepare payload for multi-turn chat endpoint
      const payloadMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const bodyPayload = {
        messages: payloadMessages,
        role: selectedRoleKey,
        modelOverride: currentRole.model,
        customInstruction: customInstructions[selectedRoleKey],
        taskContext: includeTaskContext ? tasks : undefined,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || 'No response received.',
        timestamp: Date.now(),
        modelUsed: data.modelUsed || currentRole.model,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Unable to get response:** ${err.message || 'Please check your connection and try again.'}`,
        timestamp: Date.now(),
        modelUsed: currentRole.model,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Chat history cleared. I'm ready as your **${currentRole.name}** (${currentRole.badge})! How can I help with your to-dos?`,
        timestamp: Date.now(),
        modelUsed: currentRole.model,
      },
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="gemini-chat-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="gemini-chat-panel"
        className="w-full sm:w-[480px] lg:w-[540px] h-full bg-white flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Gemini Task Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multi-Turn
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Model:</span>
                <code className="text-[11px] font-mono font-medium text-slate-700 bg-slate-200/70 px-1 py-0.2 rounded">
                  {currentRole.model}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="clear-chat-history-btn"
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
              title="Clear Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="close-gemini-chat-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">Chatbot Role & Model</span>
            <button
              onClick={() => setShowSystemInstruction(!showSystemInstruction)}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              <span>{showSystemInstruction ? 'Hide Role Prompt' : 'View Role Prompt'}</span>
              {showSystemInstruction ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRoleKey === role.key;
              return (
                <button
                  key={role.key}
                  id={`chat-role-${role.key}`}
                  onClick={() => setSelectedRoleKey(role.key)}
                  className={`p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span className="text-xs truncate">{role.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono truncate ${
                      isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
                    }`}
                  >
                    {role.model}
                  </span>
                </button>
              );
            })}
          </div>

          {/* System Instruction Viewer & Customizer */}
          {showSystemInstruction && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-1 text-slate-700 font-semibold">
                <span>System Instruction ({currentRole.name}):</span>
                <button
                  onClick={() =>
                    setCustomInstructions((prev) => ({
                      ...prev,
                      [selectedRoleKey]: currentRole.defaultInstruction,
                    }))
                  }
                  className="text-[10px] text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
              <textarea
                value={customInstructions[selectedRoleKey]}
                onChange={(e) =>
                  setCustomInstructions((prev) => ({
                    ...prev,
                    [selectedRoleKey]: e.target.value,
                  }))
                }
                rows={3}
                className="w-full text-xs font-mono p-2 bg-white border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 text-slate-800"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                This system instruction defines the role and behavior executed on the server.
              </p>
            </div>
          )}

          {/* Task Context Toggle */}
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTaskContext}
                onChange={(e) => setIncludeTaskContext(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Provide current task list context ({tasks.length} tasks)</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {currentRole.badge}
            </span>
          </div>
        </div>

        {/* Scrollable Chat Thread */}
        <div
          id="chat-message-thread"
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
        >
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs sm:text-sm ${
                  isModel ? 'justify-start' : 'justify-end'
                }`}
              >
                {isModel && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs ${
                    isModel
                      ? 'bg-white border border-slate-200 text-slate-800'
                      : 'bg-indigo-600 text-white font-normal'
                  }`}
                >
                  {/* Message Meta */}
                  <div className="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-70">
                    <span className="font-semibold">
                      {isModel ? 'TaskVault Copilot' : 'You'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {msg.modelUsed && (
                        <span className="font-mono">{msg.modelUsed}</span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={`prose prose-xs max-w-none break-words ${isModel ? 'text-slate-800' : 'text-white'}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Message Actions */}
                  {isModel && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Quick Add Button if response looks like bullet tasks */}
                      {onAddTaskFromChat && msg.content.includes('- ') && (
                        <button
                          onClick={() => {
                            const firstLine = msg.content
                              .split('\n')
                              .find((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
                            if (firstLine) {
                              const cleanTask = firstLine.replace(/^[-*]\s+(\*\*)?/, '').replace(/\*\*.*$/, '').trim();
                              if (cleanTask) onAddTaskFromChat(cleanTask);
                            }
                          }}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                          title="Add suggested task to your list"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Add Task</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isModel && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex items-center gap-2 text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span className="text-xs font-medium">
                  {currentRole.name} ({currentRole.model}) is thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Try:</span>
          {[
            'Prioritize my tasks for today',
            'Break down my high priority tasks',
            'Suggest a productive schedule',
            'Categorize my to-do list',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-medium whitespace-nowrap transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="gemini-chat-input"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Ask ${currentRole.name}... (Enter to send)`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition resize-none max-h-32"
              />
            </div>
            <button
              type="submit"
              id="gemini-chat-send-btn"
              disabled={!inputPrompt.trim() || isLoading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition flex items-center justify-center cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Powered by Gemini & TaskVault API</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
