import axiosInstance from '../axiosInstance';
import type {
  IConsultationConversation,
  IConsultationMessage,
} from '../interfaces';

const sessionHeaders = (sessionToken: string) => ({ 'X-Chat-Session': sessionToken });

export const consultationChatApi = {
  getConversations: async (sessionToken: string) => {
    const response = await axiosInstance.get<IConsultationConversation[]>(
      '/consultation-chat/conversations',
      { headers: sessionHeaders(sessionToken) },
    );
    return response.data;
  },
  getCurrentConversation: async (sessionToken: string) => {
    const response = await axiosInstance.get<IConsultationConversation | null>(
      '/consultation-chat/current',
      { headers: sessionHeaders(sessionToken) },
    );
    return response.data;
  },
  startConversation: async (sessionToken: string, guestName: string) => {
    const response = await axiosInstance.post<IConsultationConversation>(
      '/consultation-chat/current',
      { guestName },
      { headers: sessionHeaders(sessionToken) },
    );
    return response.data;
  },
  getMessages: async (sessionToken: string, conversationId: string, afterId?: string) => {
    const response = await axiosInstance.get<IConsultationMessage[]>(
      `/consultation-chat/${encodeURIComponent(conversationId)}/messages`,
      {
        headers: sessionHeaders(sessionToken),
        params: afterId ? { afterId } : undefined,
      },
    );
    return response.data;
  },
  sendMessage: async (sessionToken: string, conversationId: string, body: string) => {
    const response = await axiosInstance.post<IConsultationMessage>(
      `/consultation-chat/${encodeURIComponent(conversationId)}/messages`,
      { body },
      { headers: sessionHeaders(sessionToken) },
    );
    return response.data;
  },
};
