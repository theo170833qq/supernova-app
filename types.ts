export type Role = 'user' | 'model';

export type ModelId = 'gemini-3-pro' | 'gemini-2.5-pro' | 'gpt-3' | 'claude-3-opus' | 'mistral-large';

export interface Attachment {
  mimeType: string;
  data: string; // base64
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;
}