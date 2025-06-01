import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
  unreadCount: 0,
  socket: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    // Conversations
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action) => {
      const existingIndex = state.conversations.findIndex(
        (conv) => conv._id === action.payload._id
      );
      if (existingIndex >= 0) {
        state.conversations[existingIndex] = action.payload;
      } else {
        state.conversations.unshift(action.payload);
      }
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
      state.messages = [];
    },

    // Messages
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);

      // Update last message in conversation
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv._id === action.payload.conversation
      );
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].lastMessage = {
          content: action.payload.content,
          sender: action.payload.sender,
          sentAt: action.payload.createdAt,
        };
        // Move conversation to top
        const conversation = state.conversations.splice(
          conversationIndex,
          1
        )[0];
        state.conversations.unshift(conversation);
      }
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(
        (m) => m._id === action.payload.tempId
      );
      if (index !== -1) {
        state.messages[index] = action.payload.realMessage;
      }
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },

    // Message status
    markMessageAsRead: (state, action) => {
      const { messageId, userId } = action.payload;
      const messageIndex = state.messages.findIndex(
        (msg) => msg._id === messageId
      );
      if (messageIndex >= 0) {
        const readByIndex = state.messages[messageIndex].readBy.findIndex(
          (read) => read.user === userId
        );
        if (readByIndex === -1) {
          state.messages[messageIndex].readBy.push({
            user: userId,
            readAt: new Date().toISOString(),
          });
        }
      }
    },

    // Typing indicators
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      if (
        !state.typingUsers.find((user) => user.userId === action.payload.userId)
      ) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(
        (user) => user.userId !== action.payload.userId
      );
    },

    // Loading and error states
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Socket connection
    setSocket: (state, action) => {
      state.socket = action.payload;
    },

    // Unread count
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },

    // Reset state
    resetMessages: (state) => {
      state.conversations = [];
      state.currentConversation = null;
      state.messages = [];
      state.typingUsers = [];
      state.unreadCount = 0;
      state.error = null;
    },
  },
});

export const {
  setConversations,
  addConversation,
  setCurrentConversation,
  setMessages,
  addMessage,
  updateMessage,
  markMessageAsRead,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setLoading,
  setError,
  clearError,
  setSocket,
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  resetUnreadCount,
  resetMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
