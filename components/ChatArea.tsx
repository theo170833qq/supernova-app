import React, { useEffect, useRef, useState } from 'react';
import { Message, Attachment, ModelId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Send, Image as ImageIcon, Loader2, Sparkles, Zap, Code, Lightbulb, Compass, ArrowUp, Volume2, Square, Copy, Check, ChevronDown, Bot, Lock, Feather, Wind } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  input: string;
  isStreaming: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onSuggestionClick: (text: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  currentModel: ModelId;
  onModelChange: (model: ModelId) => void;
  isPremium: boolean;
  onOpenUpgrade: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  input,
  isStreaming,
  onInputChange,
  onSend,
  onSuggestionClick,
  onFileSelect,
  attachments,
  onRemoveAttachment,
  messagesEndRef,
  isSidebarOpen,
  toggleSidebar,
  currentModel,
  onModelChange,
  isPremium,
  onOpenUpgrade
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // Stop speaking when component unmounts or page changes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
            setIsModelMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any current speech
    
    // Create utterance
    // Remove markdown symbols for better speech flow (basic cleanup)
    const cleanText = text.replace(/[*#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    
    // Try to find a good PT-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR')) || voices.find(v => v.lang.includes('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const suggestions = [
    { icon: <Code size={20} className="text-blue-400" />, text: "Crie uma função em Python para analisar dados de vendas", label: "Código" },
    { icon: <Zap size={20} className="text-yellow-400" />, text: "Explique computação quântica para uma criança de 10 anos", label: "Explicação" },
    { icon: <Lightbulb size={20} className="text-green-400" />, text: "Dê 5 ideias criativas para nomes de startups de tecnologia", label: "Criatividade" },
    { icon: <Compass size={20} className="text-purple-400" />, text: "Crie um roteiro de viagem de 3 dias para Tóquio", label: "Planejamento" },
  ];

  const getModelLabel = (id: ModelId) => {
      switch(id) {
          case 'gemini-3-pro': return 'Supernova Ultra';
          case 'gemini-2.5-pro': return 'Supernova Fast';
          case 'gpt-3': return 'GPT-3 Legacy';
          case 'claude-3-opus': return 'Claude 3 Opus (Sim)';
          case 'mistral-large': return 'Mistral Large (Sim)';
      }
  };

  const getModelIcon = (id: ModelId) => {
      switch(id) {
          case 'gemini-3-pro': return <Sparkles size={14} className="text-accent-400" />;
          case 'gemini-2.5-pro': return <Zap size={14} className="text-yellow-400" />;
          case 'gpt-3': return <Bot size={14} className="text-green-400" />;
          case 'claude-3-opus': return <Feather size={14} className="text-orange-400" />;
          case 'mistral-large': return <Wind size={14} className="text-cyan-400" />;
      }
  };

  const handleModelSelect = (id: ModelId) => {
      const premiumModels: ModelId[] = ['gemini-3-pro', 'claude-3-opus', 'mistral-large'];
      
      if (premiumModels.includes(id) && !isPremium) {
          onOpenUpgrade();
          setIsModelMenuOpen(false);
          return;
      }
      onModelChange(id);
      setIsModelMenuOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative z-10 w-full overflow-hidden">
      
      {/* Header Glass */}
      <div className="flex items-center justify-between px-3 py-3 md:p-4 bg-cosmic-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3">
            <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
            </button>
            
            {/* Brand & Model Selector */}
            <div className="flex items-center gap-3">
                <span className="hidden md:block font-brand font-bold text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 drop-shadow-sm tracking-wide">
                    Supernova
                </span>
                
                {/* Mobile/Desktop Model Dropdown */}
                <div className="relative" ref={modelMenuRef}>
                    <button 
                        onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium text-gray-200"
                    >
                        {getModelIcon(currentModel)}
                        <span>{getModelLabel(currentModel)}</span>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isModelMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-cosmic-800 border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-fade-in z-50">
                            <div className="p-1 max-h-[400px] overflow-y-auto">
                                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Padrão Supernova</div>
                                
                                <button 
                                    onClick={() => handleModelSelect('gemini-3-pro')}
                                    className={`group flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${currentModel === 'gemini-3-pro' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="p-1.5 rounded-md bg-accent-500/20 text-accent-400"><Sparkles size={16} /></div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">Supernova Ultra</span>
                                            {!isPremium && <Lock size={12} className="text-gray-500 group-hover:text-accent-400" />}
                                        </div>
                                        <span className="text-[10px] text-gray-500">Gemini 3 Pro • Raciocínio</span>
                                    </div>
                                    {currentModel === 'gemini-3-pro' && <Check size={14} className="ml-auto text-accent-400" />}
                                </button>
                                
                                <button 
                                    onClick={() => handleModelSelect('gemini-2.5-pro')}
                                    className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${currentModel === 'gemini-2.5-pro' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="p-1.5 rounded-md bg-yellow-500/20 text-yellow-400"><Zap size={16} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">Supernova Fast</span>
                                        <span className="text-[10px] text-gray-500">Gemini 2.5 Pro • Velocidade</span>
                                    </div>
                                    {currentModel === 'gemini-2.5-pro' && <Check size={14} className="ml-auto text-yellow-400" />}
                                </button>

                                <div className="h-px bg-white/10 my-2 mx-2" />
                                <div className="px-3 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Modelos Simulados</div>

                                <button 
                                    onClick={() => handleModelSelect('claude-3-opus')}
                                    className={`group flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${currentModel === 'claude-3-opus' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="p-1.5 rounded-md bg-orange-500/20 text-orange-400"><Feather size={16} /></div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">Claude 3 Opus</span>
                                            {!isPremium && <Lock size={12} className="text-gray-500 group-hover:text-orange-400" />}
                                        </div>
                                        <span className="text-[10px] text-gray-500">Escrita Nuançada • Seguro</span>
                                    </div>
                                    {currentModel === 'claude-3-opus' && <Check size={14} className="ml-auto text-orange-400" />}
                                </button>

                                <button 
                                    onClick={() => handleModelSelect('mistral-large')}
                                    className={`group flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${currentModel === 'mistral-large' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400"><Wind size={16} /></div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">Mistral Large</span>
                                            {!isPremium && <Lock size={12} className="text-gray-500 group-hover:text-cyan-400" />}
                                        </div>
                                        <span className="text-[10px] text-gray-500">Direto • Eficiente • Lógico</span>
                                    </div>
                                    {currentModel === 'mistral-large' && <Check size={14} className="ml-auto text-cyan-400" />}
                                </button>

                                <button 
                                    onClick={() => handleModelSelect('gpt-3')}
                                    className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${currentModel === 'gpt-3' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="p-1.5 rounded-md bg-green-500/20 text-green-400"><Bot size={16} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">GPT-3 Legacy</span>
                                        <span className="text-[10px] text-gray-500">Compatibilidade • Simples</span>
                                    </div>
                                    {currentModel === 'gpt-3' && <Check size={14} className="ml-auto text-green-400" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 md:py-6 scroll-smooth space-y-6 md:space-y-8 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in max-w-4xl mx-auto px-4">
            
            <div className="mb-6 md:mb-8 relative animate-float">
                <div className="absolute inset-0 bg-primary-500 blur-[80px] opacity-20 rounded-full"></div>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-primary-600 to-accent-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 relative z-10 rotate-3 transform transition-transform hover:rotate-6">
                   <Sparkles size={40} className="text-white md:w-12 md:h-12" />
                </div>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 text-center tracking-tight">
              Olá, eu sou <span className="font-brand text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 drop-shadow-sm">Supernova</span>
            </h2>
            <p className="text-gray-400 text-center max-w-lg mb-8 md:mb-12 text-sm md:text-lg leading-relaxed px-2">
              Sua inteligência artificial avançada. Posso ajudar a escrever código, analisar imagens e explorar ideias complexas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onSuggestionClick(s.text)}
                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group text-left"
                    >
                        <div className="p-2 md:p-2.5 rounded-xl bg-black/30 group-hover:scale-110 transition-transform duration-300 border border-white/5 shrink-0">
                            {s.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{s.label}</span>
                            <span className="text-xs md:text-sm text-gray-200 group-hover:text-white line-clamp-2">{s.text}</span>
                        </div>
                    </button>
                ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-3 md:gap-4 max-w-[100%] md:max-w-4xl w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 md:w-9 md:h-9 min-w-[32px] md:min-w-[36px] rounded-xl flex items-center justify-center mt-1 shadow-lg shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gray-700 border border-gray-600' 
                    : 'bg-gradient-to-br from-primary-600 to-accent-600 shadow-primary-500/20'
                }`}>
                  {msg.role === 'user' ? (
                      <div className="text-gray-300 font-bold text-xs md:text-sm">V</div> 
                  ) : (
                      <Sparkles size={16} className="text-white" />
                  )}
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col gap-2 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full max-w-[85%] md:max-w-full`}>
                   
                   {/* Attachments */}
                   {msg.attachments && msg.attachments.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-2 justify-end">
                       {msg.attachments.map((att, idx) => (
                         <img 
                           key={idx} 
                           src={`data:${att.mimeType};base64,${att.data}`} 
                           alt="attachment" 
                           className="max-w-[200px] max-h-[200px] rounded-2xl border border-white/10 object-cover shadow-lg"
                         />
                       ))}
                     </div>
                   )}

                   {/* Text Content */}
                   <div className={`relative px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl shadow-md overflow-hidden ${
                     msg.role === 'user' 
                       ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-sm' 
                       : 'bg-cosmic-800/80 border border-white/5 text-gray-100 w-full rounded-tl-sm backdrop-blur-sm'
                   }`}>
                     {msg.role === 'user' ? (
                       <div className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">{msg.content}</div>
                     ) : (
                       <MarkdownRenderer content={msg.content} />
                     )}
                   </div>
                   
                   {/* AI Action Bar */}
                   {msg.role === 'model' && !msg.isError && (
                     <div className="flex items-center gap-1 mt-1 pl-1 animate-fade-in opacity-0 hover:opacity-100 transition-opacity duration-200 group-hover:opacity-100" style={{ opacity: 1 }}> {/* Force visible for UX, or use group-hover on parent if preferred */}
                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                             speakingMessageId === msg.id 
                               ? 'bg-primary-500/20 text-primary-300' 
                               : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                          title={speakingMessageId === msg.id ? "Parar leitura" : "Ouvir resposta"}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                                <Square size={14} className="fill-current" />
                                <span>Parar</span>
                            </>
                          ) : (
                            <>
                                <Volume2 size={14} />
                                <span className="hidden md:inline">Ouvir</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-medium"
                          title="Copiar texto"
                        >
                           {copiedMessageId === msg.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                           <span className={copiedMessageId === msg.id ? "text-green-400" : "hidden md:inline"}>
                             {copiedMessageId === msg.id ? "Copiado" : "Copiar"}
                           </span>
                        </button>
                     </div>
                   )}

                   {msg.isError && (
                     <div className="flex items-center gap-2 text-red-400 text-xs md:text-sm mt-1 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                       <Zap size={14} />
                       <span>Erro ao processar resposta.</span>
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-6 bg-gradient-to-t from-cosmic-900 via-cosmic-900 to-transparent sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto w-full relative">
            
            {/* Attachment Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-3 mb-2 md:mb-4 overflow-x-auto pb-2 px-1 scrollbar-thin">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative group animate-fade-in shrink-0">
                            <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-white/20 shadow-lg" 
                                alt="preview"
                            />
                            <button 
                                onClick={() => onRemoveAttachment(i)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={`relative flex items-end bg-cosmic-800/90 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-300 shadow-2xl ${input || attachments.length > 0 ? 'border-primary-500/50 shadow-primary-500/10' : 'border-white/10'}`}>
                {/* File Upload Button */}
                <div className="p-1.5 pl-2 pb-2 md:p-2 md:pl-3 md:pb-3">
                    <label className="cursor-pointer flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-white/10 text-gray-400 hover:text-primary-300 transition-all duration-200">
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={onFileSelect} 
                            className="hidden" 
                        />
                        <ImageIcon size={20} className="md:w-[22px] md:h-[22px]" />
                    </label>
                </div>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Envie uma mensagem..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 py-3 md:py-4 px-2 max-h-[120px] md:max-h-[150px] min-h-[44px] md:min-h-[56px] resize-none focus:outline-none overflow-y-auto leading-relaxed text-sm md:text-base"
                    rows={1}
                />

                {/* Send Button */}
                <div className="p-1.5 pr-2 pb-2 md:p-2 md:pr-3 md:pb-3">
                    <button
                        onClick={onSend}
                        disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                        className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 transform ${
                            (!input.trim() && attachments.length === 0) || isStreaming
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105'
                        }`}
                    >
                        {isStreaming ? (
                            <Loader2 size={18} className="animate-spin md:w-[20px] md:h-[20px]" />
                        ) : (
                            <ArrowUp size={20} strokeWidth={2.5} className="md:w-[22px] md:h-[22px]" />
                        )}
                    </button>
                </div>
            </div>
            <div className="text-center mt-2 md:mt-3">
                <p className="text-[9px] md:text-[10px] text-gray-500 font-medium tracking-wide">
                    SUPERNOVA IA PODE COMETER ERROS.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};