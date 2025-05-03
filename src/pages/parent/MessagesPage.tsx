import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSearch, FiEdit, FiSend, FiPaperclip, FiMoreVertical, FiImage, FiFile } from 'react-icons/fi';
import { Container, Card, Button, Input, Row, Col } from '../../components/ui';
import { PageTitle } from '../../components/common';
import { format } from 'date-fns';

// Interface for message data
interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role: 'teacher' | 'parent' | 'admin' | 'system';
  };
  content: string;
  timestamp: Date;
  attachments?: {
    id: string;
    name: string;
    type: 'image' | 'document';
    url: string;
  }[];
  read: boolean;
}

// Interface for conversation data
interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    role: 'teacher' | 'parent' | 'admin';
  }[];
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: number;
}

// Dummy data for conversations
const dummyConversations: Conversation[] = [
  {
    id: '1',
    participants: [
      {
        id: 't1',
        name: 'Mr. Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        role: 'teacher'
      }
    ],
    lastMessage: {
      content: 'I wanted to discuss Alex\'s recent math assignment.',
      timestamp: new Date(2023, 4, 12, 14, 30),
      senderId: 't1'
    },
    unreadCount: 2
  },
  {
    id: '2',
    participants: [
      {
        id: 't2',
        name: 'Mrs. Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        role: 'teacher'
      }
    ],
    lastMessage: {
      content: 'Thank you for attending the parent-teacher conference!',
      timestamp: new Date(2023, 4, 10, 16, 45),
      senderId: 't2'
    },
    unreadCount: 0
  },
  {
    id: '3',
    participants: [
      {
        id: 'a1',
        name: 'Principal Davis',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        role: 'admin'
      }
    ],
    lastMessage: {
      content: 'Reminder about the upcoming school event this Friday.',
      timestamp: new Date(2023, 4, 9, 10, 15),
      senderId: 'a1'
    },
    unreadCount: 1
  },
  {
    id: '4',
    participants: [
      {
        id: 't3',
        name: 'Ms. Thompson',
        avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
        role: 'teacher'
      }
    ],
    lastMessage: {
      content: 'I\'ve posted the new science project guidelines.',
      timestamp: new Date(2023, 4, 8, 13, 20),
      senderId: 't3'
    },
    unreadCount: 0
  },
  {
    id: '5',
    participants: [
      {
        id: 't4',
        name: 'Mr. Peterson',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        role: 'teacher'
      }
    ],
    lastMessage: {
      content: 'Your child did great on today\'s presentation!',
      timestamp: new Date(2023, 4, 8, 9, 5),
      senderId: 't4'
    },
    unreadCount: 0
  },
];

// Dummy data for messages
const dummyMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      sender: {
        id: 't1',
        name: 'Mr. Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        role: 'teacher'
      },
      content: 'Hello Mrs. Smith, I wanted to discuss Alex\'s recent math assignment. He\'s been doing well, but I noticed he\'s having some trouble with fractions.',
      timestamp: new Date(2023, 4, 12, 14, 30),
      read: true
    },
    {
      id: 'm2',
      sender: {
        id: 'p1',
        name: 'Sarah Smith',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        role: 'parent'
      },
      content: 'Thank you for letting me know. We\'ve been practicing at home, but I\'ll make sure to focus more on fractions.',
      timestamp: new Date(2023, 4, 12, 15, 45),
      read: true
    },
    {
      id: 'm3',
      sender: {
        id: 't1',
        name: 'Mr. Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        role: 'teacher'
      },
      content: 'Great! I\'ve attached some additional practice worksheets that might help.',
      timestamp: new Date(2023, 4, 12, 16, 0),
      attachments: [
        {
          id: 'a1',
          name: 'Fractions_Practice.pdf',
          type: 'document',
          url: '#'
        }
      ],
      read: false
    },
    {
      id: 'm4',
      sender: {
        id: 't1',
        name: 'Mr. Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        role: 'teacher'
      },
      content: 'Also, here\'s a chart showing Alex\'s progress over the last month. He\'s definitely improving!',
      timestamp: new Date(2023, 4, 12, 16, 5),
      attachments: [
        {
          id: 'a2',
          name: 'progress_chart.jpg',
          type: 'image',
          url: 'https://via.placeholder.com/300'
        }
      ],
      read: false
    }
  ],
  // Add more conversations as needed
};

// Main component
const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(dummyConversations);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load messages for the active conversation
  useEffect(() => {
    if (activeConversation && dummyMessages[activeConversation]) {
      setMessages(dummyMessages[activeConversation]);
      
      // Mark messages as read
      const updatedConversations = conversations.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, unreadCount: 0 } 
          : conv
      );
      setConversations(updatedConversations);
    }
  }, [activeConversation]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => 
    conv.participants.some(participant => 
      participant.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    const newMessageObj: Message = {
      id: `m${Date.now()}`,
      sender: {
        id: 'p1',
        name: 'Sarah Smith',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        role: 'parent'
      },
      content: newMessage,
      timestamp: new Date(),
      read: true
    };
    
    // Update messages
    const updatedMessages = [...messages, newMessageObj];
    setMessages(updatedMessages);
    
    // Update conversations
    const updatedConversations = conversations.map(conv => 
      conv.id === activeConversation 
        ? {
            ...conv,
            lastMessage: {
              content: newMessage,
              timestamp: new Date(),
              senderId: 'p1'
            }
          } 
        : conv
    );
    setConversations(updatedConversations);
    
    // Clear input
    setNewMessage('');
    
    // In a real app, we would send the message to the server here
  };

  return (
    <Container>
      <PageContainer
        as={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <TitleWrapper>
          <PageTitle>Messages</PageTitle>
          <SubTitle>Communicate with teachers and staff</SubTitle>
        </TitleWrapper>
        
        <MessagesLayout
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ConversationsPanel>
            <SearchContainer>
              <SearchInput 
                placeholder="Search conversations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<FiSearch />}
              />
            </SearchContainer>
            
            <ConversationsList>
              {filteredConversations.map((conversation) => (
                <ConversationItem 
                  key={conversation.id}
                  $active={activeConversation === conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  as={motion.div}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ConversationAvatar src={conversation.participants[0].avatar} alt={conversation.participants[0].name} />
                  
                  <ConversationContent>
                    <ConversationHeader>
                      <ConversationName>{conversation.participants[0].name}</ConversationName>
                      <ConversationTime>
                        {format(conversation.lastMessage.timestamp, 'MMM d')}
                      </ConversationTime>
                    </ConversationHeader>
                    
                    <ConversationPreview>
                      {conversation.lastMessage.content.length > 50
                        ? `${conversation.lastMessage.content.substring(0, 50)}...`
                        : conversation.lastMessage.content
                      }
                    </ConversationPreview>
                  </ConversationContent>
                  
                  {conversation.unreadCount > 0 && (
                    <UnreadBadge>{conversation.unreadCount}</UnreadBadge>
                  )}
                </ConversationItem>
              ))}
            </ConversationsList>
            
            <NewConversationButton
              as={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit />
              New Message
            </NewConversationButton>
          </ConversationsPanel>
          
          <MessagesPanel>
            {activeConversation ? (
              <>
                <MessageHeader>
                  <MessageHeaderInfo>
                    {activeConversation && conversations.find(c => c.id === activeConversation)?.participants[0] && (
                      <>
                        <MessageHeaderAvatar 
                          src={conversations.find(c => c.id === activeConversation)?.participants[0].avatar} 
                          alt={conversations.find(c => c.id === activeConversation)?.participants[0].name} 
                        />
                        <MessageHeaderName>
                          {conversations.find(c => c.id === activeConversation)?.participants[0].name}
                        </MessageHeaderName>
                      </>
                    )}
                  </MessageHeaderInfo>
                  
                  <MessageHeaderActions>
                    <IconButton>
                      <FiMoreVertical />
                    </IconButton>
                  </MessageHeaderActions>
                </MessageHeader>
                
                <MessageList>
                  {messages.map((message) => (
                    <MessageItem 
                      key={message.id} 
                      $self={message.sender.id === 'p1'}
                      as={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {message.sender.id !== 'p1' && (
                        <MessageAvatar src={message.sender.avatar} alt={message.sender.name} />
                      )}
                      
                      <MessageContent $self={message.sender.id === 'p1'}>
                        <MessageBubble $self={message.sender.id === 'p1'}>
                          {message.content}
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <MessageAttachments>
                              {message.attachments.map(attachment => (
                                <MessageAttachment key={attachment.id}>
                                  {attachment.type === 'image' ? (
                                    <AttachmentImage src={attachment.url} alt={attachment.name} />
                                  ) : (
                                    <AttachmentFile>
                                      <FiFile />
                                      <span>{attachment.name}</span>
                                    </AttachmentFile>
                                  )}
                                </MessageAttachment>
                              ))}
                            </MessageAttachments>
                          )}
                        </MessageBubble>
                        
                        <MessageTime>
                          {format(message.timestamp, 'h:mm a')}
                          {!message.read && message.sender.id === 'p1' && (
                            <ReadStatus>Sent</ReadStatus>
                          )}
                        </MessageTime>
                      </MessageContent>
                    </MessageItem>
                  ))}
                </MessageList>
                
                <MessageComposer>
                  <ComposerActions>
                    <IconButton>
                      <FiPaperclip />
                    </IconButton>
                    <IconButton>
                      <FiImage />
                    </IconButton>
                  </ComposerActions>
                  
                  <ComposerInput 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  
                  <SendButton 
                    disabled={!newMessage.trim()}
                    onClick={handleSendMessage}
                    as={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiSend />
                  </SendButton>
                </MessageComposer>
              </>
            ) : (
              <NoConversationSelected>
                <NoConversationContent>
                  <h3>No conversation selected</h3>
                  <p>Choose a conversation from the sidebar or start a new one.</p>
                </NoConversationContent>
              </NoConversationSelected>
            )}
          </MessagesPanel>
        </MessagesLayout>
      </PageContainer>
    </Container>
  );
};

// Styled components
const PageContainer = styled.div`
  padding: 0;
`;

const TitleWrapper = styled.div`
  margin-bottom: 24px;
`;

const SubTitle = styled.p`
  color: ${props => props.theme?.colors?.text?.secondary || '#666'};
  margin: 8px 0 0 0;
  font-size: 0.95rem;
`;

const MessagesLayout = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  height: calc(100vh - 240px);
  min-height: 500px;
  
  @media (max-width: ${props => props.theme?.breakpoints?.lg || '992px'}) {
    grid-template-columns: 280px 1fr;
  }
  
  @media (max-width: ${props => props.theme?.breakpoints?.md || '768px'}) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const ConversationsPanel = styled(Card)`
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`;

const SearchContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`;

const SearchInput = styled(Input)`
  width: 100%;
`;

const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

interface ConversationItemProps {
  $active: boolean;
}

const ConversationItem = styled.div<ConversationItemProps>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-left: 3px solid ${props => props.$active ? props.theme?.colors?.primary?.[500] || '#1890ff' : 'transparent'};
  background-color: ${props => props.$active ? props.theme?.colors?.primary?.[50] || '#e6f7ff' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? props.theme?.colors?.primary?.[100] || '#bae7ff' : props.theme?.colors?.background?.light || '#f5f5f5'};
  }
`;

const ConversationAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
`;

const ConversationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const ConversationName = styled.div`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConversationTime = styled.div`
  font-size: 12px;
  color: ${props => props.theme?.colors?.text?.secondary || '#666'};
`;

const ConversationPreview = styled.div`
  font-size: 13px;
  color: ${props => props.theme?.colors?.text?.secondary || '#666'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0 6px;
`;

const NewConversationButton = styled(Button)`
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme?.colors?.primary?.[600] || '#096dd9'};
  }
  
  svg {
    font-size: 16px;
  }
`;

const MessagesPanel = styled(Card)`
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`;

const MessageHeaderInfo = styled.div`
  display: flex;
  align-items: center;
`;

const MessageHeaderAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
`;

const MessageHeaderName = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const MessageHeaderActions = styled.div`
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme?.colors?.text?.secondary || '#666'};
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
    color: ${props => props.theme?.colors?.text?.primary || '#000'};
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface MessageItemProps {
  $self: boolean;
}

const MessageItem = styled.div<MessageItemProps>`
  display: flex;
  flex-direction: ${props => props.$self ? 'row-reverse' : 'row'};
  align-items: flex-start;
  max-width: 80%;
  align-self: ${props => props.$self ? 'flex-end' : 'flex-start'};
`;

const MessageAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
`;

interface MessageContentProps {
  $self: boolean;
}

const MessageContent = styled.div<MessageContentProps>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$self ? 'flex-end' : 'flex-start'};
  max-width: calc(100% - 44px);
`;

interface MessageBubbleProps {
  $self: boolean;
}

const MessageBubble = styled.div<MessageBubbleProps>`
  background-color: ${props => props.$self ? props.theme?.colors?.primary?.[500] || '#1890ff' : props.theme?.colors?.background?.light || '#f5f5f5'};
  color: ${props => props.$self ? 'white' : props.theme?.colors?.text?.primary || '#000'};
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-right-radius: ${props => props.$self ? '4px' : '18px'};
  border-bottom-left-radius: ${props => !props.$self ? '4px' : '18px'};
  box-shadow: ${props => props.theme?.shadows?.sm || '0 2px 8px rgba(0, 0, 0, 0.1)'};
  word-wrap: break-word;
  max-width: 100%;
`;

const MessageAttachments = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageAttachment = styled.div`
  
`;

const AttachmentImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
`;

const AttachmentFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  
  svg {
    font-size: 16px;
  }
  
  span {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: ${props => props.theme?.colors?.text?.secondary || '#666'};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ReadStatus = styled.span`
  
`;

const MessageComposer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`;

const ComposerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ComposerInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme?.colors?.border?.main || '#d9d9d9'};
  border-radius: 20px;
  font-size: 14px;
  margin: 0 12px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary?.[300] || '#91d5ff'};
    box-shadow: 0 0 0 2px ${props => props.theme?.colors?.primary?.[100] || '#e6f7ff'};
  }
`;

const SendButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme?.colors?.primary?.[600] || '#096dd9'};
  }
  
  &:disabled {
    background-color: ${props => props.theme?.colors?.border?.main || '#d9d9d9'};
    cursor: not-allowed;
  }
  
  svg {
    font-size: 16px;
  }
`;

const NoConversationSelected = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: ${props => props.theme?.colors?.background?.lighter || '#fafafa'};
`;

const NoConversationContent = styled.div`
  text-align: center;
  max-width: 300px;
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: ${props => props.theme?.colors?.text?.primary || '#000'};
  }
  
  p {
    color: ${props => props.theme?.colors?.text?.secondary || '#666'};
    font-size: 14px;
  }
`;

export { MessagesPage }; 