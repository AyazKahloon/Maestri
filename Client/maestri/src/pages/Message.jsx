import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, setUser } from "../redux/slices/authSlice";
import {
  FaSearch,
  FaPaperPlane,
  FaTimes,
  FaUser,
  FaCircle,
  FaComments,
} from "react-icons/fa";
import {
  setConversations,
  setMessages,
  addMessage,
  setCurrentConversation,
  setUnreadCount,
  decrementUnreadCount,
} from "../redux/slices/messageSlice";
import "./Message.css";
import axios from "axios";
import io from "socket.io-client";

const API_BASE_URL = "https://maestri.onrender.com";

const Message = ({ onClose }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);

  // Redux state
  const { user } = useSelector((state) => state.auth);
  const { conversations, messages, currentConversation, unreadCount } = useSelector(
    (state) => state.messages
  );

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Create axios instance with auth
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add request interceptor to include token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Fetch conversations
  // Fetch conversations
useEffect(() => {
  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      if (response.data.success) {
        dispatch(setConversations(response.data.conversations));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false); // This line should always execute
    }
  };

  if (user) {
    fetchConversations();
  } else {
    setLoading(false); // Add this line for when user is not available
  }
}, [user, dispatch]);


// Fetch messages for selected conversation
useEffect(() => {
  const fetchMessages = async () => {
    if (currentConversation) {
      try {
        console.log('Fetching messages for conversation:', currentConversation._id);
        const response = await api.get(`/messages/conversations/${currentConversation._id}/messages`);
        console.log('Messages response:', response.data);
        if (response.data.success) {
          dispatch(setMessages(response.data.messages));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }
  };

  fetchMessages();
}, [currentConversation, dispatch]);


// Initialize socket connection
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token && user) {
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setSocket(newSocket);
    });

    newSocket.on('new_message', (message) => {
      console.log('Received new message:', message);
      if (currentConversation && message.conversation === currentConversation._id) {
        // Add message to current conversation
        dispatch(addMessage(message));
      }
      
      // Update conversation list with new last message
      const updatedConversations = conversations.map(conv => 
        conv._id === message.conversation 
          ? { 
              ...conv, 
              lastMessage: { 
                content: message.content, 
                sender: message.sender, 
                sentAt: message.createdAt 
              } 
            }
          : conv
      );
      dispatch(setConversations(updatedConversations));
    });

    newSocket.on('joined_conversation', (data) => {
      console.log('Joined conversation:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      newSocket.disconnect();
    };
  }
}, [user, currentConversation, conversations, dispatch]);


  // Join conversation room when selected
// Join conversation room when selected
useEffect(() => {
  if (socket && currentConversation) {
    console.log('Joining conversation:', currentConversation._id);
    socket.emit('join_conversation', currentConversation._id);
  }
}, [socket, currentConversation]);


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection for real-time updates
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token && user) {
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setSocket(newSocket);
    });

    // Listen for request acceptance
    newSocket.on('request_accepted', async (data) => {
      console.log('Request accepted:', data);
      // Refresh user data to get updated tutorsAdded
      await refreshUserData();
      alert(`Great! ${data.tutorName} has accepted your request!`);
    });

    newSocket.on('request_declined', (data) => {
      console.log('Request declined:', data);
      alert(`${data.tutorName} has declined your request.`);
    });

    return () => {
      newSocket.disconnect();
    };
  }
}, [user]);

// Auto-scroll to bottom when new messages arrive
useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactSelect = (conversation) => {
    dispatch(setCurrentConversation(conversation));

    // If conversation has unread messages, mark as read
    if (conversation.unreadCount > 0) {
      const updatedConversations = conversations.map((conv) =>
        conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
      );
      dispatch(setConversations(updatedConversations));
      dispatch(decrementUnreadCount({ count: conversation.unreadCount }));
    }
  };

  const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() || !currentConversation || sendingMessage) return;

  setSendingMessage(true);
  const messageContent = newMessage.trim();
  setNewMessage('');

  // Create optimistic message for immediate UI update
  const optimisticMessage = {
    _id: Date.now().toString(), // Temporary ID
    conversation: currentConversation._id,
    sender: user.userType,
    senderId: {
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    },
    content: messageContent,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  // Add message to UI immediately
  dispatch(addMessage(optimisticMessage));

  try {
    // Send via socket for real-time to other users
    if (socket) {
      socket.emit('send_message', {
        conversationId: currentConversation._id,
        content: messageContent
      });
    }

    // Also send via API for persistence
    const response = await api.post('/messages/messages', {
      conversationId: currentConversation._id,
      content: messageContent
    });

    // Replace optimistic message with real message from server
    if (response.data.success) {
      const realMessage = response.data.message;
      // Update the message in the store with real data
      dispatch(updateMessage({ 
        tempId: optimisticMessage._id, 
        realMessage: realMessage 
      }));
    }

  } catch (error) {
    console.error('Error sending message:', error);
    // Remove optimistic message on error
    dispatch(removeMessage(optimisticMessage._id));
    setNewMessage(messageContent); // Restore message on error
  } finally {
    setSendingMessage(false);
  }
};



  const getOtherParticipant = (conversation) => {
    return user.userType === "student" ? conversation.tutor : conversation.student;
  };

  const filteredConversations = conversations.filter((conversation) => {
    const contact = getOtherParticipant(conversation);

    // Add safety check for contact
    if (!contact || !contact.firstName || !contact.lastName) {
      console.warn("Invalid contact data:", contact);
      return false;
    }

    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="message-page">
        <div className="message-loading">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="message-page">
      {/* Header */}
      <div className="message-header">
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close messaging"
        >
          <FaTimes />
        </button>
        <h1 className="message-title">
          <FaComments className="title-icon" />
          Message Box
        </h1>
      </div>

      <div className="message-container">
        {/* Left Panel - Contacts */}
        <div className="contacts-panel">
          {/* Search Box */}
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${user.userType === "student" ? "tutors" : "students"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search contacts"
            />
          </div>

          {/* Contacts List */}
          <div className="contacts-list">
            {filteredConversations.length === 0 ? (
              <div className="no-contacts">
                {searchTerm ? (
                  <p>No conversations found matching "{searchTerm}"</p>
                ) : (
                  <p>
                    {user.userType === "student"
                      ? "No tutors available for messaging. Send requests to tutors first and wait for them to accept!"
                      : "No students to message. Accept student requests first!"}
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const contact = getOtherParticipant(conversation);

                // Add safety check before rendering
                if (!contact || !contact.firstName || !contact.lastName) {
                  return null;
                }

                return (
                  <div
                    key={conversation._id}
                    className={`contact-item ${
                      currentConversation?._id === conversation._id ? "active" : ""
                    }`}
                    onClick={() => handleContactSelect(conversation)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleContactSelect(conversation)
                    }
                  >
                    <div className="contact-avatar">
                      <FaUser />
                      <div
                        className={`status-indicator ${
                          contact.isOnline ? "online" : "offline"
                        }`}
                      >
                        <FaCircle />
                      </div>
                    </div>
                    <div className="contact-info">
                      <div className="contact-header">
                        <h4 className="contact-name">
                          {contact.firstName} {contact.lastName}
                        </h4>
                        {conversation.unreadCount > 0 && (
                          <span className="unread-badge">{conversation.unreadCount}</span>
                        )}
                      </div>
                      {user.userType === "student" && conversation.subject && (
                        <p className="contact-subject">{conversation.subject.name}</p>
                      )}
                      <div className="last-message">
                        <p className="message-preview">
                          {conversation.lastMessage?.content || "Start a conversation..."}
                        </p>
                        <span className="message-time">
                          {conversation.lastMessage &&
                            formatTime(conversation.lastMessage.sentAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className="messages-panel">
          {currentConversation ? (
            <>
              <div className="messages-header">
                <div className="contact-info">
                  <div className="contact-avatar">
                    <FaUser />
                    <div
                      className={`status-indicator ${
                        getOtherParticipant(currentConversation).isOnline
                          ? "online"
                          : "offline"
                      }`}
                    >
                      <FaCircle />
                    </div>
                  </div>
                  <div>
                    <h4>
                      {getOtherParticipant(currentConversation).firstName}{" "}
                      {getOtherParticipant(currentConversation).lastName}
                    </h4>
                    {user.userType === "student" && currentConversation.subject && (
                      <p>{currentConversation.subject.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message ${
                      message.senderId._id === user.id ? "sent" : "received"
                    }`}
                  >
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <div className="input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    aria-label="Type a message"
                  />
                  <button
                    type="submit"
                    className="send-button"
                    aria-label="Send message"
                    disabled={sendingMessage}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-conversations">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;