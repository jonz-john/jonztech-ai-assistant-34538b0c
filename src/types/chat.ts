export interface DownloadLink {
  url: string;
  filename: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  image?: string;
  downloadLink?: DownloadLink;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperSettings {
  enabled: boolean;
  customKnowledge: string[];
}
