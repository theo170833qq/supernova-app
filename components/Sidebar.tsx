import React from 'react';
import { Plus, MessageSquare, Trash2, X, Sparkles, History, Zap, Crown } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onCloseMobile: () => void;
  isPremium: boolean;
  onOpenUpgrade: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onCloseMobile,
  isPremium,
  onOpenUpgrade
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
      />

      {/* Sidebar Content */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col h-full bg-cosmic-800/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out transform 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 
          ${isOpen ? 'md:w-[280px]' : 'md:w-0 md:overflow-hidden'}`}
        style={{ width: undefined }} // Removed inline style to rely on classes
      >
        <div className="flex flex-col h-full w-[280px] min-w-[280px]">
          {/* Header */}
          <div className="p-5 flex items-center justify-between">
            {/* Branding - Always visible */}
            <div className="flex items-center gap-3 px-1">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg shadow-primary-500/20">
                    <Sparkles size={18} className="text-white" />
                </div>
                <span className="font-brand font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 drop-shadow-sm">Supernova</span>
            </div>
            
            {/* Mobile Close Button - Inside Header */}
            <button 
                onClick={onCloseMobile}
                className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            >
                <X size={20} />
            </button>
          </div>

          <div className="px-5 pb-2">
            <button
              onClick={onNewChat}
              className="group relative flex items-center justify-center w-full gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-300 border border-white/5 hover:border-white/10"
            >
              <Plus size={18} className="transition-transform group-hover:rotate-90 text-primary-400" />
              <span className="font-medium text-sm tracking-wide">Nova Conversa</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
            <div className="flex items-center gap-2 px-3 mb-3 text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">
                <History size={12} />
                <span>Recentes</span>
            </div>
            
            {sessions.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-8 px-4 italic opacity-70">
                O cosmo está silencioso...
                <br />
                Inicie uma nova jornada.
              </div>
            )}
            
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
                  currentSessionId === session.id
                    ? 'bg-white/10 text-white border-white/5 shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={currentSessionId === session.id ? 'text-accent-500' : 'text-gray-600 group-hover:text-gray-400'} />
                  <span className="truncate text-sm font-medium whitespace-nowrap overflow-hidden max-w-[170px]">
                    {session.title || 'Nova Conversa'}
                  </span>
                </div>
                {/* Delete Button */}
                <button
                  onClick={(e) => onDeleteSession(e, session.id)}
                  className={`p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${currentSessionId === session.id ? 'opacity-100' : ''}`}
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-black/20">
             {isPremium ? (
               <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-primary-900/50 to-accent-900/50 border border-white/5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Crown size={16} fill="currentColor" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">Membro Ultra</span>
                    <span className="text-xs text-primary-300">Acesso Total</span>
                  </div>
               </div>
             ) : (
               <button 
                onClick={onOpenUpgrade}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent-500/30 transition-all group"
               >
                  <div className="w-9 h-9 rounded-full bg-gray-700 group-hover:bg-gradient-to-br group-hover:from-violet-500 group-hover:to-fuchsia-500 flex items-center justify-center text-gray-300 group-hover:text-white transition-all shrink-0">
                    <Zap size={18} className="fill-current" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-gray-200 group-hover:text-white text-sm font-semibold transition-colors">Upgrade Plan</span>
                    <span className="text-xs text-gray-500 group-hover:text-primary-200 transition-colors">Desbloqueie o Pro</span>
                  </div>
               </button>
             )}
          </div>
        </div>
      </div>
    </>
  );
};
