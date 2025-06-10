import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiSend,  FiPaperclip, 
  FiImage, FiFile, FiSmile, FiPlus,  FiCheck,
   FiUsers, FiMessageSquare, FiChevronLeft,
  FiPhone, FiVideo, FiInfo
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
// import { useAuth } from '../../contexts/AuthContext';

// Types
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: string;
  senderId: number;
  isRead: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'other';
  url: string;
  size?: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: Message;
  unreadCount: number;
  isGroup?: boolean;
  name?: string;
}

interface Participant {
  id: number;
  name: string;
  avatar?: string;
  role: 'teacher' | 'student' | 'admin';
  status?: 'online' | 'offline' | 'away';
  lastActive?: Date;
}

interface MessageTimeProps {
  $isCurrentUser: boolean;
}

const TeacherMessages: React.FC = () => {
  // const { user } = useAuth();
  const { t } = useTranslation();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isMobileViewActive, setIsMobileViewActive] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Mock teacher ID (would come from auth context in a real app)
  const currentUserId = 1;
  
  // Mock data for conversations
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: [
        {
          id: 1,
          name: 'You (Teacher)',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          role: 'teacher',
          status: 'online'
        },
        {
          id: 2,
          name: 'John Smith',
          avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
          role: 'student',
          status: 'online'
        }
      ],
      lastMessage: {
        id: 'm1',
        content: 'I have a question about the homework assignment',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        sender: 'John Smith',
        senderId: 2,
        isRead: false
      },
      unreadCount: 1
    },
    {
      id: '2',
      participants: [
        {
          id: 1,
          name: 'You (Teacher)',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          role: 'teacher',
          status: 'online'
        },
        {
          id: 3,
          name: 'Emily Johnson',
          avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
          role: 'student',
          status: 'offline',
          lastActive: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        }
      ],
      lastMessage: {
        id: 'm2',
        content: 'Thank you for the feedback on my project!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      unreadCount: 0
    },
    {
      id: '3',
      isGroup: true,
      name: 'Math Class Group',
      participants: [
        {
          id: 1,
          name: 'You (Teacher)',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          role: 'teacher',
          status: 'online'
        },
        {
          id: 2,
          name: 'John Smith',
          avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
          role: 'student',
          status: 'online'
        },
        {
          id: 3,
          name: 'Emily Johnson',
          avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
          role: 'student',
          status: 'offline'
        },
        {
          id: 4,
          name: 'Michael Brown',
          avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
          role: 'student',
          status: 'away'
        }
      ],
      lastMessage: {
        id: 'm3',
        content: 'Don\'t forget about the quiz tomorrow!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      unreadCount: 0
    },
    {
      id: '4',
      participants: [
        {
          id: 1,
          name: 'You (Teacher)',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          role: 'teacher',
          status: 'online'
        },
        {
          id: 5,
          name: 'Sarah Wilson',
          avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
          role: 'student',
          status: 'online'
        }
      ],
      lastMessage: {
        id: 'm4',
        content: 'I\'ll be absent tomorrow due to a doctor\'s appointment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        sender: 'Sarah Wilson',
        senderId: 5,
        isRead: true
      },
      unreadCount: 0
    }
  ];
  
  // Mock messages for conversations
  const mockMessages: Record<string, Message[]> = {
    '1': [
      {
        id: 'm1-1',
        content: 'Hello, how can I help you today?',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      {
        id: 'm1-2',
        content: 'I have a question about the homework assignment',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        sender: 'John Smith',
        senderId: 2,
        isRead: false
      }
    ],
    '2': [
      {
        id: 'm2-1',
        content: 'Hi Emily, I\'ve reviewed your project',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      {
        id: 'm2-2',
        content: 'Great work on the analysis section!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 30), // 3 hours ago + 30 seconds
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      {
        id: 'm2-3',
        content: 'Thank you for the feedback on my project!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        sender: 'Emily Johnson',
        senderId: 3,
        isRead: true
      }
    ],
    '3': [
      {
        id: 'm3-1',
        content: 'Hello everyone, welcome to the Math Class Group!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      {
        id: 'm3-2',
        content: 'We\'ll use this group for class announcements',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60), // 2 days ago + 1 minute
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      {
        id: 'm3-3',
        content: 'Thanks for creating this group!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5), // 2 days ago + 5 minutes
        sender: 'John Smith',
        senderId: 2,
        isRead: true
      },
      {
        id: 'm3-4',
        content: 'Don\'t forget about the quiz tomorrow!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      }
    ],
    '4': [
      {
        id: 'm4-1',
        content: 'Hi Sarah, how are you doing with the assignment?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        sender: 'You (Teacher)',
        senderId: 1,
        isRead: true
      },
      {
        id: 'm4-2',
        content: 'I\'m working on it, but I have a doctor\'s appointment tomorrow',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 - 1000 * 60), // 4 hours and 1 minute ago
        sender: 'Sarah Wilson',
        senderId: 5,
        isRead: true
      },
      {
        id: 'm4-3',
        content: 'I\'ll be absent tomorrow due to a doctor\'s appointment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        sender: 'Sarah Wilson',
        senderId: 5,
        isRead: true
      }
    ]
  };
  
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
  
  // Set first conversation as active initially
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations, activeConversation]);
  
  // Scroll to bottom of messages when active conversation changes or new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation, messages]);
  
  // Handle searching conversations
  const filteredConversations = conversations.filter(conversation => {
    // For group chats, search by group name
    if (conversation.isGroup && conversation.name) {
      return conversation.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    // For direct messages, search by the name of the other participant (not the current user)
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return false;
  });
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!messageText.trim() || !activeConversation) return;
    
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      content: messageText,
      timestamp: new Date(),
      sender: 'You (Teacher)',
      senderId: currentUserId,
      isRead: false
    };
    
    // Update messages
    setMessages(prevMessages => ({
      ...prevMessages,
      [activeConversation]: [...(prevMessages[activeConversation] || []), newMessage]
    }));
    
    // Update conversation with last message
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, lastMessage: newMessage, unreadCount: 0 }
          : conv
      )
    );
    
    // Clear input
    setMessageText('');
    
    // Close emoji picker and attachment options if open
    setShowEmojiPicker(false);
    setShowAttachmentOptions(false);
  };
  
  // Function to format timestamp
  const formatMessageTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  return (
    <MessagesContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader>
        <div>
          <PageTitle>{t('teacherPanel.messages.title')}</PageTitle>
          <PageDescription>{t('teacherPanel.messages.description')}</PageDescription>
        </div>
        
        <HeaderActions>
          <NewMessageButton onClick={() => console.log('New message')}>
            <FiPlus size={16} />
            <span>{t('teacherPanel.messages.newMessage')}</span>
          </NewMessageButton>
        </HeaderActions>
      </PageHeader>
      
      <MessagingInterface>
        {/* Conversation list (sidebar) */}
        <ConversationList 
          className={isMobileViewActive ? 'hidden' : ''}
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
              placeholder={t('teacherPanel.messages.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ConversationItems>
            <AnimatePresence>
              {filteredConversations.map((conversation) => {
                // Find the other participant (not the current user) for direct messages
                const otherParticipant = conversation.isGroup 
                  ? null 
                  : conversation.participants.find(p => p.id !== currentUserId);
                
                return (
                  <ConversationItem
                    key={conversation.id}
                    $isActive={activeConversation === conversation.id}
                    $hasUnread={conversation.unreadCount > 0}
                    onClick={() => {
                      setActiveConversation(conversation.id);
                      setIsMobileViewActive(true);
                    }}
                    as={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ x: 3 }}
                  >
                    <ConversationAvatar>
                      {conversation.isGroup ? (
                        <GroupAvatarContainer>
                          <FiUsers size={22} />
                        </GroupAvatarContainer>
                      ) : (
                        <Avatar src={otherParticipant?.avatar || ''} alt={otherParticipant?.name || ''} />
                      )}
                      {otherParticipant?.status === 'online' && (
                        <StatusIndicator $status="online" />
                      )}
                    </ConversationAvatar>
                    
                    <ConversationDetails>
                      <ConversationName>
                        {conversation.isGroup 
                          ? conversation.name 
                          : otherParticipant?.name}
                      </ConversationName>
                      <LastMessage>
                        {conversation.lastMessage.content.length > 35
                          ? `${conversation.lastMessage.content.substring(0, 35)}...`
                          : conversation.lastMessage.content}
                      </LastMessage>
                    </ConversationDetails>
                    
                    <ConversationMeta>
                      <MessageTime $isCurrentUser={false}>
                        {formatMessageTime(conversation.lastMessage.timestamp)}
                      </MessageTime>
                      {conversation.unreadCount > 0 && (
                        <UnreadBadge>
                          {conversation.unreadCount}
                        </UnreadBadge>
                      )}
                    </ConversationMeta>
                  </ConversationItem>
                );
              })}
            </AnimatePresence>
          </ConversationItems>
        </ConversationList>
        
        {/* Main chat area */}
        <ChatArea className={!isMobileViewActive ? 'hidden' : ''}>
          {activeConversation ? (
            <>
              <ChatHeader>
                {isMobileViewActive && (
                  <BackButton onClick={() => setIsMobileViewActive(false)}>
                    <FiChevronLeft />
                  </BackButton>
                )}
                
                {/* Display the current conversation's info */}
                {(() => {
                  const conversation = conversations.find(c => c.id === activeConversation);
                  if (!conversation) return null;
                  
                  const otherParticipant = conversation.isGroup 
                    ? null 
                    : conversation.participants.find(p => p.id !== currentUserId);
                  
                  return (
                    <ChatHeaderContent>
                      <ChatHeaderAvatar>
                        {conversation.isGroup ? (
                          <GroupAvatarContainer>
                            <FiUsers size={22} />
                          </GroupAvatarContainer>
                        ) : (
                          <Avatar src={otherParticipant?.avatar || ''} alt={otherParticipant?.name || ''} />
                        )}
                        {otherParticipant?.status === 'online' && (
                          <StatusIndicator $status="online" />
                        )}
                      </ChatHeaderAvatar>
                      
                      <ChatHeaderInfo>
                        <ChatHeaderName>
                          {conversation.isGroup 
                            ? conversation.name 
                            : otherParticipant?.name}
                        </ChatHeaderName>
                        <ChatHeaderStatus>
                          {otherParticipant?.status === 'online' 
                              ? t('teacherPanel.messages.online')
                            : t('teacherPanel.messages.lastSeen', { time: `${Math.floor(Math.random() * 60)} min` })}
                        </ChatHeaderStatus>
                      </ChatHeaderInfo>
                    </ChatHeaderContent>
                  );
                })()}
                
                <ChatHeaderActions>
                  <HeaderActionButton title="Audio Call">
                    <FiPhone />
                  </HeaderActionButton>
                  <HeaderActionButton title="Video Call">
                    <FiVideo />
                  </HeaderActionButton>
                  <HeaderActionButton title="Info">
                    <FiInfo />
                  </HeaderActionButton>
                </ChatHeaderActions>
              </ChatHeader>
              
              <ChatMessagesContainer>
                <AnimatePresence>
                  {activeConversation && messages[activeConversation]?.map((message, index) => (
                    <MessageWrapper
                      key={message.id}
                      $isCurrentUser={message.senderId === currentUserId}
                      as={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MessageBubble $isCurrentUser={message.senderId === currentUserId}>
                        <MessageContent>{message.content}</MessageContent>
                        <MessageTime $isCurrentUser={message.senderId === currentUserId}>
                          {formatMessageTime(message.timestamp)}
                          {message.senderId === currentUserId && message.isRead && (
                            <ReadMarker>Read</ReadMarker>
                          )}
                        </MessageTime>
                      </MessageBubble>
                    </MessageWrapper>
                  ))}
                </AnimatePresence>
                <div ref={messageEndRef} />
              </ChatMessagesContainer>
              
              <MessageComposer>
                <ComposerActionButton onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}>
                  <FiPaperclip />
                </ComposerActionButton>
                
                {showAttachmentOptions && (
                  <AttachmentOptions>
                    <AttachmentOption title="Send Image">
                      <FiImage />
                    </AttachmentOption>
                    <AttachmentOption title="Send File">
                      <FiFile />
                    </AttachmentOption>
                  </AttachmentOptions>
                )}
                
                <MessageInput 
                  placeholder="Type a message..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                
                <ComposerActionButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <FiSmile />
                </ComposerActionButton>
                
                <SendButton 
                  disabled={!messageText.trim()} 
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
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
    transform: translateY(-2px);
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
  box-shadow: ${props => props.theme.isDark ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    
    .hidden {
      display: none;
    }
  }
`;

const ConversationList = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  border-right: 1px solid ${props => props.theme.colors.border.light};
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
  background-color: ${props => 
    props.$isActive 
      ? props.theme.isDark 
        ? `${props.theme.colors.primary[500]}25` 
        : `${props.theme.colors.primary[500]}15` 
      : 'transparent'};
  border-left: 3px solid ${props => 
    props.$isActive ? props.theme.colors.primary[500] : 'transparent'};
  
  &:hover {
    background-color: ${props => 
      props.$isActive 
        ? props.theme.isDark 
          ? `${props.theme.colors.primary[500]}30` 
          : `${props.theme.colors.primary[500]}15` 
        : props.theme.colors.background.hover};
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

const GroupAvatarContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.isDark ? props.theme.colors.primary[700] : props.theme.colors.primary[100]};
  color: ${props => props.theme.isDark ? props.theme.colors.background.primary : props.theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme.colors.background.primary};
`;

interface StatusIndicatorProps {
  $status: 'online' | 'offline' | 'away';
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
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
  color: ${props => props.theme.isDark ? 'rgba(255, 255, 255, 0.6)' : '#6c757d'};
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
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
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
  background-color: ${props => props.theme.colors.background.primary};
  
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
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: ${props => props.$isCurrentUser ? 'flex-end' : 'flex-start'};
  padding: 0 1rem;
`;

interface MessageBubbleProps {
  $isCurrentUser: boolean;
}

const MessageBubble = styled.div<MessageBubbleProps>`
  display: inline-block;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 80%;
  word-wrap: break-word;
  background-color: ${props => props.$isCurrentUser 
    ? props.theme.colors.primary[500] 
    : props.theme.isDark 
      ? props.theme.colors.background.tertiary 
      : props.theme.colors.background.secondary};
  color: ${props => props.$isCurrentUser ? 'white' : props.theme.colors.text.primary};
  box-shadow: ${props => props.theme.isDark 
    ? '0 1px 3px rgba(0, 0, 0, 0.2)' 
    : '0 1px 2px rgba(0, 0, 0, 0.05)'};
`;

const MessageContent = styled.div`
  word-break: break-word;
`;

const ReadMarker = styled.span`
  font-size: 0.65rem;
  color: ${props => props.theme.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
  margin-left: 0.25rem;
`;

const MessageComposer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
  position: relative;
`;

const ComposerContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
`;

const ComposerActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: ${props => props.theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
    transform: translateY(-2px);
  }
`;

const AttachmentOptions = styled.div`
  position: absolute;
  bottom: 100%;
  left: 1rem;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 0.5rem;
  box-shadow: ${props => props.theme.isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  display: flex;
  padding: 0.5rem;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 15px;
    width: 10px;
    height: 10px;
    background-color: ${props => props.theme.colors.background.primary};
    transform: rotate(45deg);
  }
`;

const AttachmentOption = styled(ComposerActionButton)`
  background-color: ${props => props.theme.colors.background.secondary};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const MessageInput = styled.input`
  flex: 1;
  border: none;
  background-color: ${props => props.theme.isDark ? props.theme.colors.background.tertiary : props.theme.colors.background.primary};
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
  background-color: ${props => props.theme.colors.background.primary};
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

// Add this if ConversationTime component exists
const ConversationTime = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.text.tertiary};
  margin-top: 0.25rem;
`;

export default TeacherMessages;