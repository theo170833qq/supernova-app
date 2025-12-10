import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";
import { Message, Attachment, ModelId } from "../types";

// Initialize the API client
// Ensure process.env.API_KEY is available in your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert UI messages to API Content format
const formatHistory = (messages: Message[]): Content[] => {
  return messages.map(msg => {
    const parts: any[] = [];
    
    // Add text part if it exists
    if (msg.content) {
      parts.push({ text: msg.content });
    }
    
    // Add attachments if they exist (User only typically)
    if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    return {
      role: msg.role,
      parts: parts
    };
  });
};

const getModelConfig = (modelId: ModelId) => {
  switch (modelId) {
    case 'gemini-3-pro':
      return {
        model: 'gemini-3-pro-preview',
        instruction: `Você é a Supernova (Edição Ultra), uma IA de elite baseada no modelo Gemini 3 Pro.

Diretrizes:
1.  **Excelência Técnica:** Forneça respostas profundas, detalhadas e tecnicamente precisas.
2.  **Raciocínio:** Utilize raciocínio passo-a-passo para problemas complexos.
3.  **Persona:** Sofisticada, moderna e proativa.
4.  **Formatação:** Use Markdown rico (tabelas, código, negrito).
5.  **Identidade:** Se perguntada, confirme que você é a versão Ultra rodando no Gemini 3 Pro.`
      };
    case 'gemini-2.5-pro':
      // Mapping "2.5 Pro" request to 2.5 Flash for speed/efficiency in this context
      return {
        model: 'gemini-2.5-flash',
        instruction: `Você é a Supernova (Edição Fast), focada em velocidade e eficiência, baseada no modelo Gemini 2.5 Flash.

Diretrizes:
1.  **Velocidade:** Seja direta e concisa. Evite divagações desnecessárias.
2.  **Eficiência:** Vá direto ao ponto.
3.  **Identidade:** Você é a versão otimizada para performance.`
      };
    case 'gpt-3':
      // Simulation of a legacy model using Flash
      return {
        model: 'gemini-2.5-flash',
        instruction: `Você está operando em "Modo de Compatibilidade GPT-3 Legacy".

Diretrizes:
1.  **Simulação:** Aja como um assistente de IA genérico e prestativo de 2021.
2.  **Estilo:** Seja simples, robótico mas educado, e evite excesso de personalidade "cósmica".
3.  **Restrições:** Mantenha respostas mais curtas e padronizadas.
4.  **Nota:** Se perguntada, diga que está rodando em modo de compatibilidade legado.`
      };
    case 'claude-3-opus':
      // Simulation of Opus using 3-Pro capabilities
      return {
        model: 'gemini-3-pro-preview',
        instruction: `Você está operando no modo "Claude 3 Opus (Simulado)".

Diretrizes:
1.  **Estilo de Escrita:** Adote um tom altamente articulado, nuançado e quase literário. Evite jargões robóticos comuns de IA.
2.  **Segurança e Ética:** Priorize respostas extremamente seguras, inofensivas e honestas, características marcantes do modelo simulado.
3.  **Profundidade:** Forneça explicações abrangentes e detalhadas, explorando múltiplas facetas de uma questão.
4.  **Nota:** Se perguntada, esclareça que você é a Supernova simulando o estilo e capacidades do Claude 3 Opus.`
      };
    case 'mistral-large':
       // Simulation of Mistral using 3-Pro capabilities
       return {
         model: 'gemini-3-pro-preview',
         instruction: `Você está operando no modo "Mistral Large (Simulado)".

Diretrizes:
1.  **Eficiência Europeia:** Seja extremamente direto, lógico e sem "fluff" (conteúdo vazio).
2.  **Foco em Código:** Demonstre alta proficiência técnica e concisão em exemplos de código.
3.  **Transparência:** Adote um tom mais técnico e "open-weight", menos conversacional e mais funcional.
4.  **Nota:** Se perguntada, esclareça que você é a Supernova simulando o estilo do Mistral Large.`
       };
    default:
      return {
         model: 'gemini-3-pro-preview',
         instruction: ''
      };
  }
};

export const streamChatResponse = async (
  previousMessages: Message[],
  newMessageContent: string,
  attachments: Attachment[] = [],
  modelId: ModelId = 'gemini-3-pro'
): Promise<AsyncIterable<string>> => {
  
  // Create chat history from previous messages
  const history = formatHistory(previousMessages);
  const config = getModelConfig(modelId);

  const chat = ai.chats.create({
    model: config.model,
    history: history,
    config: {
      temperature: 0.7,
      topK: 64,
      topP: 0.95,
      systemInstruction: config.instruction,
    }
  });

  const parts: any[] = [{ text: newMessageContent }];
  
  if (attachments.length > 0) {
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }

  // Use sendMessageStream for the real-time feel
  const result = await chat.sendMessageStream({
    message: parts
  });

  // Generator to yield text chunks
  async function* streamGenerator() {
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  }

  return streamGenerator();
};

export const generateTitle = async (firstMessage: string): Promise<string> => {
  try {
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Flash is sufficient and faster for simple title generation
        contents: `Analise a seguinte mensagem inicial de um chat e crie um título curto, elegante e relevante (máximo 4 palavras). Mensagem: "${firstMessage}". Retorne apenas o título.`,
    });
    return result.text ? result.text.trim() : 'Nova Conversa';
  } catch (e) {
    console.error("Failed to generate title", e);
    return 'Nova Conversa';
  }
};