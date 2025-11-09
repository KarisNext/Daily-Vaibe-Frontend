// frontend/src/components/admin/AdminChat.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AdminUser {
  admin_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface OnlineAdmin {
  admin_id: number;
  name: string;
  role: string;
  email: string;
  last_active: string;
  avatar: string;
}

interface ChatMessage {
  message_id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number | null;
  message_text: string;
  is_broadcast: boolean;
  created_at: string;
  is_own?: boolean;
}

interface AdminChatProps {
  currentAdmin: AdminUser;
  onClose: () => void;
}

const AdminChat: React.FC<AdminChatProps> = ({ currentAdmin, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineAdmins, setOnlineAdmins] = useState<OnlineAdmin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<OnlineAdmin | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch online admins
  const fetchOnlineAdmins = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat/online');
      if (response.ok) {
        const data = await response.json();
        setOnlineAdmins(data.admins.filter((admin: OnlineAdmin) => 
          admin.admin_id !== currentAdmin.admin_id
        ));
      }
    } catch (error) {
      console.error('Error fetching online admins:', error);
    }
  }, [currentAdmin.admin_id]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const receiverId = selectedAdmin?.admin_id;
      const url = receiverId 
        ? `/api/admin/chat/messages?receiver_id=${receiverId}`
        : '/api/admin/chat/messages';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.map((msg: ChatMessage) => ({
          ...msg,
          is_own: msg.sender_id === currentAdmin.admin_id
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAdmin, currentAdmin.admin_id]);

  // Update last active status
  const updateLastActive = useCallback(async () => {
    try {
      await fetch('/api/admin/chat/heartbeat', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: selectedAdmin?.admin_id || null,
          message_text: messageText.trim(),
          is_broadcast: !selectedAdmin
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          ...data.message,
          is_own: true
        }]);
        setMessageText('');
        scrollToBottom();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter admins based on search
  const filteredAdmins = onlineAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize and polling
  useEffect(() => {
    fetchOnlineAdmins();
    fetchMessages();
    updateLastActive();

    // Poll for new messages and online admins every 5 seconds
    pollingInterval.current = setInterval(() => {
      fetchMessages();
      fetchOnlineAdmins();
      updateLastActive();
    }, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchOnlineAdmins, fetchMessages, updateLastActive]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refresh messages when selecting different admin
  useEffect(() => {
    setIsLoading(true);
    fetchMessages();
  }, [selectedAdmin, fetchMessages]);

  if (isMinimized) {
    return (
      <div className="admin-chat-container minimized">
        <div className="chat-header" onClick={() => setIsMinimized(false)}>
          <div className="chat-header-left">
            <span className="chat-icon">💬</span>
            <h3>Admin Chat</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-icon">💬</span>
          <div>
            <h3>Admin Chat</h3>
            {selectedAdmin && (
              <span className="chat-with">
                with {selectedAdmin.name}
              </span>
            )}
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="chat-minimize-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            −
          </button>
          <button
            className="chat-close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="chat-body">
        {/* Sidebar with online admins */}
        <div className="chat-sidebar">
          <div className="chat-search">
            <input
              type="text"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admins-list">
            {/* Broadcast option */}
            <button
              className={`admin-item ${!selectedAdmin ? 'selected' : ''}`}
              onClick={() => setSelectedAdmin(null)}
            >
              <div className="admin-avatar">
                📢
              </div>
              <div className="admin-info">
                <div className="admin-name">Broadcast to All</div>
                <div className="admin-role">Send to all admins</div>
              </div>
            </button>

            {/* Individual admins */}
            {filteredAdmins.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                {searchQuery ? 'No admins found' : 'No other admins online'}
              </div>
            ) : (
              filteredAdmins.map(admin => (
                <button
                  key={admin.admin_id}
                  className={`admin-item ${selectedAdmin?.admin_id === admin.admin_id ? 'selected' : ''}`}
                  onClick={() => setSelectedAdmin(admin)}
                >
                  <div className="admin-avatar">
                    {admin.avatar}
                    <div className="online-indicator"></div>
                  </div>
                  <div className="admin-info">
                    <div className="admin-name">{admin.name}</div>
                    <div className="admin-role">{admin.role.replace('_', ' ')}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          {!selectedAdmin && messages.length === 0 ? (
            <div className="chat-empty">
              <div className="empty-icon">💬</div>
              <p>Select an admin to start chatting</p>
              <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                or broadcast to all admins
              </p>
            </div>
          ) : (
            <>
              <div className="messages-container">
                {isLoading ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.message_id}
                      className={`message ${message.is_own ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        {!message.is_own && (
                          <div style={{ 
                            fontSize: '12px', 
                            opacity: 0.8, 
                            marginBottom: '4px',
                            fontWeight: 600 
                          }}>
                            {message.sender_name}
                          </div>
                        )}
                        <div className="message-text">
                          {message.message_text}
                        </div>
                        <div className="message-time">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                {error && (
                  <div className="chat-error">{error}</div>
                )}
                <div>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      selectedAdmin 
                        ? `Message ${selectedAdmin.name}...` 
                        : 'Broadcast to all admins...'
                    }
                    disabled={isSending}
                    className="message-input"
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || isSending}
                    className="send-btn"
                  >
                    {isSending ? '⏳' : '📤'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;