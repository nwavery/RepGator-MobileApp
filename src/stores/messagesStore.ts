import { create } from 'zustand';
import { fetchProtectedData } from '../services/apiClient';
import { Representative } from './repsStore'; // Might need rep info for conversation list

// --- Types ---
// TODO: Define these types based on actual API response

export type ConversationParticipant = {
  id: string;
  name: string;
  // Add other relevant participant info (e.g., type: 'user' | 'representative')
};

export type ShortMessage = {
  id: string;
  senderId: string;
  text: string; // Or snippet
  timestamp: string; // ISO 8601 format preferably
};

export type ConversationPreview = {
  id: string;
  participants: ConversationParticipant[];
  lastMessage: ShortMessage | null;
  unreadCount: number;
  // Add other relevant preview fields (e.g., representative details?)
};

export type Message = {
    id: string;
    conversationId: string;
    senderId: string;
    senderName?: string; // Denormalized for display?
    recipientId: string;
    text: string;
    timestamp: string;
    isRead?: boolean;
    sendStatus?: 'sending' | 'sent' | 'failed'; // Add status for optimistic updates
};


// Map to store messages for each conversation
// Key: conversationId, Value: Message[]
type ConversationMessages = {
  [conversationId: string]: Message[];
};

type MessagesState = {
  conversations: ConversationPreview[]; // List of conversation previews
  messages: ConversationMessages;      // Detailed messages for opened conversations
  status: 'idle' | 'loading' | 'error' | 'success';
  conversationStatus: { [convId: string]: 'idle' | 'loading' | 'error' | 'success' }; // Status per conversation
  error: string | null;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>; // Add fetchMessages definition
  addMessage: (conversationId: string, message: Message) => void; // Add addMessage definition
  // Add action to update message status/ID after sending
  updateSentMessage: (conversationId: string, tempId: string, confirmedMessage: Message | null, status: 'sent' | 'failed') => void;
  // Add actions for sending messages etc. later
};

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  messages: {}, // Initialize messages map
  status: 'idle',
  conversationStatus: {}, // Initialize conversation status map
  error: null,

  fetchConversations: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      // Use actual apiClient function
      const fetchedConversations = await getConversations(); // Assuming getConversations is imported or available

      // Sort conversations by last message timestamp (newest first)
      const sortedConversations = fetchedConversations.sort((a, b) => {
         if (!a.lastMessage) return 1; // Conversations without messages maybe appear last
         if (!b.lastMessage) return -1;
         // Ensure 'timestamp' exists on lastMessage before accessing
         return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      });

      set({ conversations: sortedConversations, status: 'success' });
    } catch (apiError: any) {
      console.error('Failed to fetch conversations:', apiError);
      const errorMessage = apiError.message || 'Failed to load conversations.';
      set({ status: 'error', error: errorMessage, conversations: [] });
    }
  },

  fetchMessages: async (conversationId: string) => {
    // Avoid refetching if already loading or successful for this conversation
    if (get().conversationStatus[conversationId] === 'loading' || get().conversationStatus[conversationId] === 'success') {
      // console.log(`Skipping fetch for ${conversationId}, status: ${get().conversationStatus[conversationId]}`);
      // If already successful, maybe trigger a background refresh instead? For now, just return.
      return;
    }

    set(state => ({
        conversationStatus: { ...state.conversationStatus, [conversationId]: 'loading' }
    }));

    try {
      // Use actual apiClient function
      const fetchedMessages = await getMessagesForConversation(conversationId); // Assuming getMessagesForConversation is imported

      // Sort messages by timestamp (oldest first for display)
      const sortedMessages = fetchedMessages.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      set(state => ({
          messages: { ...state.messages, [conversationId]: sortedMessages },
          conversationStatus: { ...state.conversationStatus, [conversationId]: 'success' }
      }));
    } catch (apiError: any) {
       console.error(`Failed to fetch messages for ${conversationId}:`, apiError);
       const errorMessage = apiError.message || 'Failed to load messages.';
       set(state => ({
            conversationStatus: { ...state.conversationStatus, [conversationId]: 'error' },
            // Optionally store error specific to this conversation
       }));
    }
  },

  addMessage: (conversationId: string, message: Message) => {
     set(state => {
        const existingMessages = state.messages[conversationId] || [];
        // Ensure no duplicate temp IDs if rapidly adding
        const filteredMessages = existingMessages.filter(m => m.id !== message.id);
        const updatedMessages = [...filteredMessages, message].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Also update the conversation preview's last message
        const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
                // Adapt the full Message to ShortMessage format for the preview
                const shortMessage: ShortMessage = {
                    id: message.id,
                    senderId: message.senderId,
                    text: message.text, // Assuming 'text' field exists
                    timestamp: message.timestamp,
                };
                 return { ...conv, lastMessage: shortMessage, unreadCount: 0 }; // Assuming viewing resets unread
            }
            return conv;
        }).sort((a, b) => { // Re-sort conversations after updating last message
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        });

        return {
            messages: { ...state.messages, [conversationId]: updatedMessages },
            conversations: updatedConversations, // Update conversation list
        };
     });
  },

  // Action to update message based on API response
  updateSentMessage: (conversationId: string, tempId: string, confirmedMessage: Message | null, status: 'sent' | 'failed') => {
    set(state => {
        const conversationMessages = state.messages[conversationId];
        if (!conversationMessages) return state; // No messages for this convo

        const updatedMessages = conversationMessages.map(msg => {
            if (msg.id === tempId) {
                // Return a new object with the correct type explicitly
                if (status === 'sent' && confirmedMessage) {
                    const updatedMsg: Message = {
                        ...confirmedMessage, // Use server-confirmed data
                        sendStatus: 'sent', // Mark as sent
                    };
                    return updatedMsg;
                } else {
                    // If failed, just update the status
                     const updatedMsg: Message = {
                        ...msg, // Keep optimistic data
                        sendStatus: 'failed', // Mark as failed
                    };
                    return updatedMsg;
                }
            }
            return msg;
        });

        // Ensure the map operation didn't change the array type unintentionally
        const correctlyTypedMessages: Message[] = updatedMessages;

        // Sort again after update
        correctlyTypedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return {
            ...state, // Return the whole state to be safe with typing
            messages: { ...state.messages, [conversationId]: correctlyTypedMessages },
        };
    });
  },

  // Placeholder for future actions:
  // sendMessage: async (newMessage: Omit<Message, 'id' | 'timestamp'>) => { ... },

}));

// --- Helper functions or selectors can be defined here if needed ---
// Example selector to get messages for a specific conversation
// export const selectMessagesForConversation = (conversationId: string) => (state: MessagesState) => state.messages[conversationId] || [];

// Import missing API functions at the top
import { getConversations, getMessagesForConversation, sendMessage } from '../services/apiClient';
