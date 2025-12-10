import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { UpgradeModal } from './components/UpgradeModal';
import { ChatSession, Message, Attachment, ModelId } from './types';
import { streamChatResponse, generateTitle } from './services/geminiService';

// Utility for ID generation
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  // --- State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Model & Premium State
  // Default to 2.5 Pro initially so they don't hit the paywall immediately upon first load
  const [currentModel, setCurrentModel] = useState<ModelId>('gemini-2.5-pro'); 
  const [isPremium, setIsPremium] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('gemini-chat-sessions');
    const savedPremium = localStorage.getItem('supernova-premium');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    } else {
        createNewSession();
    }

    if (savedPremium === 'true') {
        setIsPremium(true);
        // If they were already premium, we can default to 3-pro if we want, or keep it sticky
        // Let's only switch to 3-pro if they select it, or if we want to force it upon upgrade
    }
    
    // Check screen size for initial sidebar state
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
    
    // Check for Payment Success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
        handleUpgrade(true); // True indicates it came from redirect
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
        localStorage.setItem('gemini-chat-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // --- Auto Scroll ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, isStreaming]);

  // --- Helpers ---
  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'Nova Conversa',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput('');
    setAttachments([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile on new chat
  };

  const updateCurrentSessionMessages = (updateFn: (msgs: Message[]) => Message[]) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: updateFn(s.messages), updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  };

  const handleUpgrade = (fromRedirect = false) => {
      setIsPremium(true);
      localStorage.setItem('supernova-premium', 'true');
      setCurrentModel('gemini-3-pro'); // Auto switch to pro model upon upgrade
      
      if (fromRedirect) {
          // Add a welcome message to the current chat or just show a toast (omitted for simplicity, state update is enough)
      }
  };

  // --- Handlers ---

  const handleSend = async (textOverride?: string) => {
    // If textOverride is provided, use it. Otherwise use input state.
    const textToSend = textOverride !== undefined ? textOverride : input;

    if ((!textToSend.trim() && attachments.length === 0) || !currentSessionId || isStreaming) return;

    const currentAttachments = [...attachments]; // Copy
    
    // Clear input immediately
    setInput('');
    setAttachments([]);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      attachments: currentAttachments
    };

    // Add User Message
    updateCurrentSessionMessages(msgs => [...msgs, userMessage]);

    // Optimistic AI Message (empty initially)
    const aiMessageId = generateId();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now()
    };
    
    updateCurrentSessionMessages(msgs => [...msgs, aiMessage]);
    setIsStreaming(true);

    try {
      // Get history *before* this new exchange
      const currentSession = sessions.find(s => s.id === currentSessionId);
      const history = currentSession ? currentSession.messages : [];

      // Generate title if it's the first message
      if (history.length === 0) {
        generateTitle(textToSend).then(title => {
             updateSessionTitle(currentSessionId, title);
        });
      }

      // Pass currentModel to the service
      const stream = await streamChatResponse(history, textToSend, currentAttachments, currentModel);
      
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        updateCurrentSessionMessages(msgs => msgs.map(m => 
          m.id === aiMessageId ? { ...m, content: fullText } : m
        ));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      updateCurrentSessionMessages(msgs => msgs.map(m => 
        m.id === aiMessageId ? { ...m, content: "Ocorreu um erro ao processar sua solicitação. Por favor, verifique sua conexão ou tente novamente.", isError: true } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
             const result = e.target?.result as string;
             const base64Data = result.split(',')[1];
             resolve(base64Data);
          };
        });
        reader.readAsDataURL(file);
        
        const data = await base64Promise;
        newAttachments.push({
            mimeType: file.type,
            data: data
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    e.target.value = '';
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const currentMessages = getCurrentSession()?.messages || [];

  return (
    <div className="flex h-[100dvh] bg-cosmic-900 text-gray-100 font-sans selection:bg-primary-500/30 overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => {
            setCurrentSessionId(id);
            if(window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onDeleteSession={deleteSession}
        onCloseMobile={() => setIsSidebarOpen(false)}
        isPremium={isPremium}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
      />
      
      <ChatArea 
        messages={currentMessages}
        input={input}
        isStreaming={isStreaming}
        onInputChange={setInput}
        onSend={() => handleSend()}
        onSuggestionClick={(text) => handleSend(text)}
        onFileSelect={handleFileSelect}
        attachments={attachments}
        onRemoveAttachment={(idx) => setAttachments(prev => prev.filter((_, i) => i !== idx))}
        messagesEndRef={messagesEndRef}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
        isPremium={isPremium}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
      />

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onUpgrade={() => handleUpgrade(false)}
      />
    </div>
  );
};

export default App;