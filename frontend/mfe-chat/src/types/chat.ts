export type Message = {
  id: string;
  conversationId: string;
  senderId: number;
  recipientId: number;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  deleted?: boolean;
};

export type LastMessageSummary = {
  content: string;
  senderId: number;
  createdAt: string;
};

export type Conversation = {
  conversationId: string;
  otherUserId: number;
  lastMessage: LastMessageSummary;
};

export const MAX_MESSAGE_LENGTH = 2000;
