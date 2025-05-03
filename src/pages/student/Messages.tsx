import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiPlus, FiMoreVertical, FiSend, FiPaperclip, FiSmile, FiChevronLeft, FiFilter, FiInfo, FiMessageSquare, FiCheck } from 'react-icons/fi';
// import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  read: boolean;
  isIncoming: boolean;
}

interface Conversation {
  id: string;
  recipient: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
    lastSeen?: Date;
  };
  lastMessage?: {
    content: string;
    timestamp: Date;
    read: boolean;
  };
  unreadCount: number;
}

const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Mock conversations data
  const conversations: Conversation[] = [
    {
      id: '1',
      recipient: {
        id: 'teacher1',
        name: 'Dr. Smith',
        role: 'Math Teacher',
        status: 'online',
      },
      lastMessage: {
        content: 'Don\'t forget about the quiz tomorrow!',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
      },
      unreadCount: 1,
    },
    {
      id: '2',
      recipient: {
        id: 'teacher2',
        name: 'Mrs. Johnson',
        role: 'English Professor',
        status: 'away',
        lastSeen: new Date(Date.now() - 45 * 60 * 1000),
      },
      lastMessage: {
        content: 'The essay deadline has been extended by three days.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: true,
      },
      unreadCount: 0,
    },
    {
      id: '3',
      recipient: {
        id: 'admin1',
        name: 'Admin Office',
        role: 'Administrative Staff',
        status: 'online',
      },
      lastMessage: {
        content: 'Your student ID card is ready for pickup.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: false,
      },
      unreadCount: 1,
    },
    {
      id: '4',
      recipient: {
        id: 'student1',
        name: 'Alex Barnes',
        role: 'Classmate',
        status: 'offline',
        lastSeen: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      lastMessage: {
        content: 'Did you understand the homework for today?',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        read: true,
      },
      unreadCount: 0,
    },
    {
      id: '5',
      recipient: {
        id: 'teacher3',
        name: 'Prof. Wilson',
        role: 'Chemistry Department',
        status: 'offline',
        lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      lastMessage: {
        content: 'Please bring your lab coat for tomorrow\'s experiment.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        read: true,
      },
      unreadCount: 0,
    },
  ];

  // Mock messages for selected conversation
  const getConversationMessages = (conversationId: string): Message[] => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return [];

    const recipient = conversation.recipient;
    
    // Generate a series of messages for this conversation
    return [
      {
        id: `${conversationId}-1`,
        content: `Hello! How can I help you with your studies?`,
        sender: {
          id: recipient.id,
          name: recipient.name,
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: true,
        isIncoming: true,
      },
      {
        id: `${conversationId}-2`,
        content: `Hi ${recipient.name}, I have a question about the recent assignment.`,
        sender: {
          id: user?.username || 'current-user',
          name: user?.fullName || 'You',
        },
        timestamp: new Date(Date.now() - 2.9 * 60 * 60 * 1000),
        read: true,
        isIncoming: false,
      },
      {
        id: `${conversationId}-3`,
        content: `Sure, what do you need help with?`,
        sender: {
          id: recipient.id,
          name: recipient.name,
        },
        timestamp: new Date(Date.now() - 2.8 * 60 * 60 * 1000),
        read: true,
        isIncoming: true,
      },
      {
        id: `${conversationId}-4`,
        content: `I'm not sure how to approach problem number 5.`,
        sender: {
          id: user?.username || 'current-user',
          name: user?.fullName || 'You',
        },
        timestamp: new Date(Date.now() - 2.7 * 60 * 60 * 1000),
        read: true,
        isIncoming: false,
      },
      {
        id: `${conversationId}-5`,
        content: conversation.lastMessage?.content || "Let me know if you need any other assistance.",
        sender: {
          id: recipient.id,
          name: recipient.name,
        },
        timestamp: conversation.lastMessage?.timestamp || new Date(),
        read: conversation.lastMessage?.read || false,
        isIncoming: true,
      },
    ];
  };

  // Handle mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => 
    conversation.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedConversation) return;
    
    console.log(`Sending message to conversation ${selectedConversation}: ${newMessage}`);
    
    // Clear input field
    setNewMessage('');
    
    // Focus back on input
    messageInputRef.current?.focus();
  };

  // Format message time
  const formatMessageTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Format last seen time
  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };
  
  // Get current conversation
  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const messages = selectedConversation ? getConversationMessages(selectedConversation) : [];

  return (
    <MessagesContainer>
      <PageHeader>
        <div>
          <PageTitle>Messages</PageTitle>
          <PageDescription>Chat with teachers, classmates, and staff</PageDescription>
        </div>
        
        <HeaderActions>
          <NewMessageButton onClick={() => console.log('New message')}>
            <FiPlus size={16} />
            <span>New Message</span>
          </NewMessageButton>
        </HeaderActions>
      </PageHeader>
      
      <MessagingInterface>
        {/* Conversation list sidebar */}
        <ConversationList 
          className={isMobileView && selectedConversation ? 'hidden' : ''}
          as={motion.div}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SearchContainer>
            <SearchIconWrapper>
              <FiSearch />
            </SearchIconWrapper>
            <SearchInput
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ConversationItems>
            <AnimatePresence>
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  $isActive={selectedConversation === conversation.id}
                  $hasUnread={conversation.unreadCount > 0}
                  onClick={() => setSelectedConversation(conversation.id)}
                  as={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ x: 3 }}
                >
                  <ConversationAvatar>
                    {conversation.recipient.avatar ? (
                      <Avatar src={conversation.recipient.avatar} alt={conversation.recipient.name} />
                    ) : (
                      <AvatarPlaceholder>
                        {conversation.recipient.name.charAt(0)}
                      </AvatarPlaceholder>
                    )}
                    {conversation.recipient.status === 'online' && (
                      <StatusIndicator $status="online" />
                    )}
                  </ConversationAvatar>
                  
                  <ConversationDetails>
                    <ConversationName>{conversation.recipient.name}</ConversationName>
                    <RecipientRole>{conversation.recipient.role}</RecipientRole>
                    {conversation.lastMessage && (
                      <LastMessage>
                        {conversation.lastMessage.content.length > 35
                          ? `${conversation.lastMessage.content.substring(0, 35)}...`
                          : conversation.lastMessage.content}
                      </LastMessage>
                    )}
                  </ConversationDetails>
                  
                  <ConversationMeta>
                    {conversation.lastMessage && (
                      <MessageTime $isCurrentUser={false}>
                        {formatLastSeen(conversation.lastMessage.timestamp)}
                      </MessageTime>
                    )}
                    {conversation.unreadCount > 0 && (
                      <UnreadBadge>
                        {conversation.unreadCount}
                      </UnreadBadge>
                    )}
                  </ConversationMeta>
                </ConversationItem>
              ))}
            </AnimatePresence>
          </ConversationItems>
        </ConversationList>
        
        {/* Main chat area */}
        <ChatArea className={!isMobileView && !selectedConversation ? 'hidden' : ''}>
          {selectedConversation && currentConversation ? (
            <>
              <ChatHeader>
                {isMobileView && (
                  <BackButton onClick={() => setSelectedConversation(null)}>
                    <FiChevronLeft />
                  </BackButton>
                )}
                
                <ChatHeaderContent>
                  <ChatHeaderAvatar>
                    {currentConversation.recipient.avatar ? (
                      <Avatar 
                        src={currentConversation.recipient.avatar} 
                        alt={currentConversation.recipient.name} 
                      />
                    ) : (
                      <AvatarPlaceholder>
                        {currentConversation.recipient.name.charAt(0)}
                      </AvatarPlaceholder>
                    )}
                    {currentConversation.recipient.status === 'online' && (
                      <StatusIndicator $status="online" />
                    )}
                  </ChatHeaderAvatar>
                  
                  <ChatHeaderInfo>
                    <ChatHeaderName>
                      {currentConversation.recipient.name}
                    </ChatHeaderName>
                    <ChatHeaderStatus>
                      {currentConversation.recipient.status === 'online' 
                        ? 'Online' 
                        : `Last seen ${formatLastSeen(currentConversation.recipient.lastSeen)}`
                      }
                    </ChatHeaderStatus>
                  </ChatHeaderInfo>
                </ChatHeaderContent>
                
                <ChatHeaderActions>
                  <HeaderActionButton title="Info">
                    <FiInfo />
                  </HeaderActionButton>
                  <HeaderActionButton title="More">
                    <FiMoreVertical />
                  </HeaderActionButton>
                </ChatHeaderActions>
              </ChatHeader>
              
              <ChatMessagesContainer>
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <MessageWrapper
                      key={message.id}
                      $isCurrentUser={!message.isIncoming}
                      as={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MessageBubble $isCurrentUser={!message.isIncoming}>
                        <MessageContent>{message.content}</MessageContent>
                        <MessageTime $isCurrentUser={!message.isIncoming}>
                          {formatMessageTime(message.timestamp)}
                          {!message.isIncoming && message.read && (
                            <ReadMarker>Read</ReadMarker>
                          )}
                        </MessageTime>
                      </MessageBubble>
                    </MessageWrapper>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </ChatMessagesContainer>
              
              <MessageComposer>
                <ComposerActionButton>
                  <FiPaperclip />
                </ComposerActionButton>
                
                <MessageInput 
                  ref={messageInputRef}
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                
                <ComposerActionButton>
                  <FiSmile />
                </ComposerActionButton>
                
                <SendButton 
                  disabled={!newMessage.trim()} 
                  onClick={handleSendMessage}
                >
                  <FiSend />
                </SendButton>
              </MessageComposer>
            </>
          ) : (
            <EmptyStateContainer>
              <FiMessageSquare size={48} />
              <EmptyStateTitle>No Conversation Selected</EmptyStateTitle>
              <EmptyStateText>Choose a conversation from the list to start messaging</EmptyStateText>
            </EmptyStateContainer>
          )}
        </ChatArea>
      </MessagingInterface>
    </MessagesContainer>
  );
};

// Styled Components
const MessagesContainer = styled.div`
  padding: 1rem 0;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

const PageDescription = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  margin: 0.25rem 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const NewMessageButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #0095f6;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #0077c5;
  }
`;

const MessagingInterface = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-gap: 1rem;
  height: calc(100vh - 180px);
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    
    .hidden {
      display: none;
    }
  }
`;

const ConversationList = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const SearchIconWrapper = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  margin-right: 0.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  outline: none;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const ConversationItems = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.border.light};
    border-radius: 3px;
  }
`;

interface ConversationItemProps {
  $isActive: boolean;
  $hasUnread: boolean;
}

const ConversationItem = styled.div<ConversationItemProps>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isActive ? `${props.theme.colors.primary[500]}15` : 'transparent'};
  border-left: 3px solid ${props => props.$isActive ? props.theme.colors.primary[500] : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$isActive ? `${props.theme.colors.primary[500]}15` : props.theme.colors.background.hover};
  }
`;

const ConversationAvatar = styled.div`
  position: relative;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.background.primary};
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[100]};
  color: ${props => props.theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid ${props => props.theme.colors.background.primary};
`;

interface StatusProps {
  $status: 'online' | 'offline' | 'away';
}

const StatusIndicator = styled.div<StatusProps>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => 
    props.$status === 'online' ? '#4CAF50' : 
    props.$status === 'away' ? '#FFC107' : '#9E9E9E'};
  border: 2px solid ${props => props.theme.colors.background.primary};
`;

const ConversationDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
`;

const RecipientRole = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.tertiary};
  margin-bottom: 0.25rem;
`;

const LastMessage = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConversationMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 0.5rem;
  min-width: 40px;
`;

interface MessageTimeProps {
  $isCurrentUser: boolean;
}

const MessageTime = styled.div<MessageTimeProps>`
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 0.25rem;
  text-align: right;
`;

const UnreadBadge = styled.div`
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  font-size: 0.7rem;
  font-weight: 500;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChatArea = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.background.primary};
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: #f8f9fa;
`;

const BackButton = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  padding: 0.375rem;
  margin-right: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const ChatHeaderContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const ChatHeaderAvatar = styled(ConversationAvatar)`
  margin-right: 0.75rem;
`;

const ChatHeaderInfo = styled.div`
  flex: 1;
`;

const ChatHeaderName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
`;

const ChatHeaderStatus = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const ChatHeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const HeaderActionButton = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const ChatMessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.border.light};
    border-radius: 3px;
  }
`;

interface MessageWrapperProps {
  $isCurrentUser: boolean;
}

const MessageWrapper = styled.div<MessageWrapperProps>`
  display: flex;
  justify-content: ${props => props.$isCurrentUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 0.75rem;
  width: 100%;
`;

interface MessageBubbleProps {
  $isCurrentUser: boolean;
}

const MessageBubble = styled.div<MessageBubbleProps>`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  border-bottom-right-radius: ${props => props.$isCurrentUser ? '0.25rem' : '1rem'};
  border-bottom-left-radius: ${props => !props.$isCurrentUser ? '0.25rem' : '1rem'};
  background-color: ${props => props.$isCurrentUser ? '#e3f2fd' : 'white'};
  color: #212529;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid ${props => props.$isCurrentUser ? '#d0e8fc' : '#e9ecef'};
`;

const MessageContent = styled.div`
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
`;

const ReadMarker = styled.span`
  font-size: 0.7rem;
  color: #6c757d;
  margin-left: 0.25rem;
`;

const MessageComposer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
`;

const ComposerActionButton = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const MessageInput = styled.input`
  flex: 1;
  border: none;
  background-color: ${props => props.theme.colors.background.primary};
  padding: 0.6rem 1rem;
  border-radius: 1.5rem;
  outline: none;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  margin: 0 0.5rem;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const SendButton = styled(ComposerActionButton)<{ disabled: boolean }>`
  color: ${props => props.disabled ? props.theme.colors.text.tertiary : '#0095f6'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  margin-left: 0.25rem;
`;

const EmptyStateContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: ${props => props.theme.colors.text.tertiary};
`;

const EmptyStateTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 500;
  margin: 1rem 0 0.5rem;
  color: ${props => props.theme.colors.text.primary};
`;

const EmptyStateText = styled.p`
  font-size: 0.875rem;
  text-align: center;
  max-width: 20rem;
  margin: 0;
`;

export default Messages; 