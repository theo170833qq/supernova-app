import React, { useState } from 'react';
import { X, Check, Sparkles, Zap, Shield, Star, ExternalLink } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------------------------------
  // CONFIGURAÇÃO DE PAGAMENTO
  // -------------------------------------------------------------------------
  // 1. Crie uma conta no Stripe (stripe.com)
  // 2. Crie um produto "Supernova Ultra" por R$ 29,90
  // 3. Crie um "Payment Link" para esse produto.
  // 4. Nas configurações do Link, defina a "Página de confirmação" para:
  //    https://seu-site.com/?payment_success=true
  // 5. Cole o link do Stripe abaixo:
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_..."; // COLOCAR SEU LINK AQUI
  // -------------------------------------------------------------------------

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsLoading(true);
    
    // Simulação visual de "Indo para o checkout..."
    setTimeout(() => {
        // Se o usuário não configurou o link, simulamos o sucesso para teste
        if (STRIPE_PAYMENT_LINK.includes('test_...')) {
            onUpgrade();
            onClose();
            alert("Como o link de pagamento não foi configurado (modo teste), o plano foi liberado gratuitamente.");
        } else {
            // Redireciona para o Checkout Real
            window.location.href = STRIPE_PAYMENT_LINK;
        }
        setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-cosmic-800 border border-white/10 rounded-3xl shadow-2xl shadow-primary-500/20 overflow-hidden animate-slide-up">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-600/20 to-accent-600/20 blur-xl pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 relative z-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 mb-4">
              <Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Supernova <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Ultra</span></h2>
            <p className="text-gray-400 text-sm">Desbloqueie o poder máximo da inteligência artificial.</p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 mb-6">
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-4xl font-bold text-white">R$ 29,90</span>
              <span className="text-gray-400 mb-1">/ mês</span>
            </div>
            <p className="text-center text-xs text-primary-300 font-medium">Cancele quando quiser</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} strokeWidth={3} /></div>
              <span className="text-gray-200 text-sm">Acesso ao <strong>Gemini 3 Pro</strong> (Mais Inteligente)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} strokeWidth={3} /></div>
              <span className="text-gray-200 text-sm">Raciocínio lógico e matemático avançado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} strokeWidth={3} /></div>
              <span className="text-gray-200 text-sm">Respostas mais rápidas e sem limites</span>
            </div>
             <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} strokeWidth={3} /></div>
              <span className="text-gray-200 text-sm">Suporte a uploads de alta resolução</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold shadow-lg shadow-primary-500/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Redirecionando...</span>
              </>
            ) : (
              <>
                <Zap size={20} className="fill-current" />
                <span>Assinar Ultra Agora</span>
              </>
            )}
          </button>
          
          <p className="text-center text-[10px] text-gray-500 mt-4 flex items-center justify-center gap-1">
             <Shield size={10} /> Pagamento processado de forma segura via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
};