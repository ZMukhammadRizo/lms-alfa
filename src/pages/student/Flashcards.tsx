import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiEdit, FiShare2, FiBook, FiClock, FiAward, FiTag } from 'react-icons/fi';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastered: boolean;
  lastReviewed?: Date;
}

interface FlashcardSet {
  id: string;
  title: string;
  subject: string;
  totalCards: number;
  masteredCards: number;
  lastStudied?: Date;
  tags: string[];
}

const Flashcards: React.FC = () => {
  const [activeView, setActiveView] = useState<'sets' | 'study'>('sets');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Mock data for flashcard sets
  const flashcardSets: FlashcardSet[] = [
    {
      id: 'set1',
      title: 'Biology - Cell Structure',
      subject: 'Biology',
      totalCards: 15,
      masteredCards: 8,
      lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      tags: ['science', 'biology', 'cells']
    },
    {
      id: 'set2',
      title: 'Math - Calculus Fundamentals',
      subject: 'Mathematics',
      totalCards: 24,
      masteredCards: 12,
      lastStudied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      tags: ['math', 'calculus']
    },
    {
      id: 'set3',
      title: 'History - World War II',
      subject: 'History',
      totalCards: 20,
      masteredCards: 15,
      lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      tags: ['history', 'world wars']
    },
    {
      id: 'set4',
      title: 'Programming - JavaScript Basics',
      subject: 'Computer Science',
      totalCards: 30,
      masteredCards: 20,
      lastStudied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      tags: ['programming', 'javascript', 'web development']
    },
    {
      id: 'set5',
      title: 'Chemistry - Periodic Table',
      subject: 'Chemistry',
      totalCards: 18,
      masteredCards: 5,
      tags: ['science', 'chemistry', 'elements']
    }
  ];
  
  // Mock data for flashcards
  const flashcards: Record<string, Flashcard[]> = {
    'set1': [
      { id: 'card1_1', question: 'What is a cell?', answer: 'The basic structural and functional unit of all living organisms.', mastered: true },
      { id: 'card1_2', question: 'What is the function of mitochondria?', answer: 'Powerhouse of the cell, responsible for cellular respiration and producing energy in the form of ATP.', mastered: true },
      { id: 'card1_3', question: 'What is the function of the nucleus?', answer: 'Control center of the cell, contains genetic material (DNA) and directs cell activities.', mastered: false },
      { id: 'card1_4', question: 'What is the endoplasmic reticulum?', answer: 'A network of membranous tubules within the cytoplasm involved in protein and lipid synthesis.', mastered: false },
      { id: 'card1_5', question: 'What are lysosomes?', answer: 'Membrane-bound vesicles containing digestive enzymes that break down waste materials and cellular debris.', mastered: true }
    ],
    'set2': [
      { id: 'card2_1', question: 'What is a derivative?', answer: 'A rate of change of a function with respect to a variable.', mastered: true },
      { id: 'card2_2', question: 'What is an integral?', answer: 'The area under a curve, representing the accumulation of quantities.', mastered: false },
      { id: 'card2_3', question: 'What is the chain rule?', answer: 'A formula for computing the derivative of a composite function.', mastered: true }
    ],
    'set3': [
      { id: 'card3_1', question: 'When did World War II begin?', answer: 'September 1, 1939, with Germany\'s invasion of Poland.', mastered: true },
      { id: 'card3_2', question: 'When did World War II end?', answer: 'September 2, 1945, with Japan\'s formal surrender.', mastered: true },
      { id: 'card3_3', question: 'Who were the Allied Powers?', answer: 'Primarily the United States, Great Britain, France, and the Soviet Union.', mastered: false }
    ],
    'set4': [
      { id: 'card4_1', question: 'What is a variable in JavaScript?', answer: 'A named storage for data that can be modified during program execution.', mastered: true },
      { id: 'card4_2', question: 'What is the difference between let and const?', answer: 'let declares a block-scoped variable that can be reassigned, while const declares a block-scoped variable that cannot be reassigned.', mastered: false },
      { id: 'card4_3', question: 'What is a function in JavaScript?', answer: 'A reusable block of code designed to perform a particular task.', mastered: true },
      { id: 'card4_4', question: 'What are JavaScript promises?', answer: 'Objects representing the eventual completion or failure of an asynchronous operation.', mastered: false }
    ],
    'set5': [
      { id: 'card5_1', question: 'What is the atomic number?', answer: 'The number of protons in an atom\'s nucleus, which determines the chemical element.', mastered: true },
      { id: 'card5_2', question: 'What are isotopes?', answer: 'Variants of a particular chemical element that have the same number of protons but different numbers of neutrons.', mastered: false },
      { id: 'card5_3', question: 'What is a noble gas?', answer: 'Elements in group 18 of the periodic table that are colorless, odorless, and generally non-reactive.', mastered: false }
    ]
  };
  
  // Initialize mastered cards from mock data
  useEffect(() => {
    if (activeSetId && flashcards[activeSetId]) {
      const initialMastered = new Set<string>();
      flashcards[activeSetId].forEach(card => {
        if (card.mastered) {
          initialMastered.add(card.id);
        }
      });
      setMasteredCards(initialMastered);
    }
  }, [activeSetId]);
  
  // Get all unique tags across all sets
  const allTags = Array.from(new Set(flashcardSets.flatMap(set => set.tags)));
  
  // Filter sets based on search term and tag filter
  const filteredSets = flashcardSets.filter(set => {
    const matchesSearch = searchTerm === '' || 
                        set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        set.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = filterTag === null || set.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });
  
  // Get current active set
  const activeSet = activeSetId ? flashcardSets.find(set => set.id === activeSetId) : null;
  
  // Get current active set cards
  const activeSetCards = activeSetId ? flashcards[activeSetId] || [] : [];
  
  // Flip card handler
  const handleFlipCard = (cardId: string) => {
    setFlippedCards(prev => {
      const newFlipped = new Set(prev);
      if (newFlipped.has(cardId)) {
        newFlipped.delete(cardId);
      } else {
        newFlipped.add(cardId);
      }
      return newFlipped;
    });
  };
  
  // Toggle card mastery
  const toggleCardMastery = (cardId: string) => {
    setMasteredCards(prev => {
      const newMastered = new Set(prev);
      if (newMastered.has(cardId)) {
        newMastered.delete(cardId);
      } else {
        newMastered.add(cardId);
      }
      return newMastered;
    });
  };
  
  // Start studying a set
  const startStudying = (setId: string) => {
    setActiveSetId(setId);
    setCurrentCardIndex(0);
    setFlippedCards(new Set());
    setActiveView('study');
  };
  
  // Navigate to previous card
  const goToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setFlippedCards(new Set());
    }
  };
  
  // Navigate to next card
  const goToNextCard = () => {
    if (currentCardIndex < activeSetCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setFlippedCards(new Set());
    }
  };
  
  // Back to sets view
  const backToSets = () => {
    setActiveView('sets');
    setActiveSetId(null);
  };
  
  // Format date for last studied
  const formatDate = (date?: Date): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  // Get progress percentage
  const getProgressPercentage = (total: number, mastered: number): number => {
    return Math.round((mastered / total) * 100);
  };
  
  // Get random color for set card based on subject
  const getSubjectColor = (subject: string): string => {
    const colors = {
      'Mathematics': '#4338CA', // Indigo
      'Biology': '#059669', // Emerald
      'Chemistry': '#D97706', // Amber
      'Physics': '#2563EB', // Blue
      'History': '#DC2626', // Red
      'Computer Science': '#7C3AED', // Violet
      'English': '#0891B2', // Cyan
    };
    
    return colors[subject as keyof typeof colors] || '#6B7280'; // Default gray
  };
  
  return (
    <Container>
      <AnimatePresence mode="wait">
        {activeView === 'sets' ? (
          <motion.div
            key="sets-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <PageHeader>
              <HeaderContent>
                <PageTitle>Flashcards</PageTitle>
                <PageDescription>Create, study, and master your coursework with flashcards</PageDescription>
              </HeaderContent>
              <HeaderStats>
                <StatItem>
                  <StatValue>{flashcardSets.length}</StatValue>
                  <StatLabel>Sets</StatLabel>
                </StatItem>
                <StatDivider />
                <StatItem>
                  <StatValue>{Object.values(flashcards).reduce((acc, cards) => acc + cards.length, 0)}</StatValue>
                  <StatLabel>Cards</StatLabel>
                </StatItem>
                <StatDivider />
                <StatItem>
                  <StatValue>{Object.values(flashcards).reduce((acc, cards) => acc + cards.filter(c => c.mastered).length, 0)}</StatValue>
                  <StatLabel>Mastered</StatLabel>
                </StatItem>
              </HeaderStats>
            </PageHeader>
            
            <ContentContainer>
              <TopControls>
                <SearchFilter>
                  <SearchWrapper>
                    <FiSearch />
                    <SearchInput 
                      type="text" 
                      placeholder="Search flashcard sets..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </SearchWrapper>
                  
                  <FilterWrapper>
                    <FiTag />
                    <Select 
                      value={filterTag || ''} 
                      onChange={(e) => setFilterTag(e.target.value || null)}
                    >
                      <option value="">All Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </Select>
                  </FilterWrapper>
                </SearchFilter>
                
                <NewSetButton>
                  <FiPlus />
                  <span>Create New Set</span>
                </NewSetButton>
              </TopControls>
              
              {filteredSets.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <FiBook size={48} />
                  </EmptyStateIcon>
                  <EmptyStateTitle>No flashcard sets found</EmptyStateTitle>
                  <EmptyStateDescription>No sets matching your criteria were found.</EmptyStateDescription>
                  <CreateNewButton>
                    <FiPlus />
                    <span>Create your first set</span>
                  </CreateNewButton>
                </EmptyState>
              ) : (
                <CardSetsGrid>
                  {filteredSets.map(set => (
                    <CardSetBox 
                      key={set.id}
                      as={motion.div}
                      whileHover={{ y: -8 }}
                      $accentColor={getSubjectColor(set.subject)}
                    >
                      <CardSetContent>
                        <SetHeader>
                          <SubjectBadge $bgColor={getSubjectColor(set.subject)}>
                            {set.subject}
                          </SubjectBadge>
                          <CardCount>
                            <FiBook />
                            <span>{set.totalCards} Cards</span>
                          </CardCount>
                        </SetHeader>
                        
                        <CardSetTitle>{set.title}</CardSetTitle>
                        
                        <ProgressSection>
                          <ProgressBarWrapper>
                            <ProgressLabel>
                              <span>Mastery Progress</span>
                              <span>{set.masteredCards}/{set.totalCards}</span>
                            </ProgressLabel>
                            <ProgressBar>
                              <ProgressFill 
                                width={getProgressPercentage(set.totalCards, set.masteredCards)} 
                                $accentColor={getSubjectColor(set.subject)}
                              />
                            </ProgressBar>
                          </ProgressBarWrapper>
                          
                          <LastStudiedWrapper>
                            <FiClock />
                            <LastStudied>
                              {formatDate(set.lastStudied)}
                            </LastStudied>
                          </LastStudiedWrapper>
                        </ProgressSection>
                        
                        <TagsContainer>
                          {set.tags.map(tag => (
                            <Tag 
                              key={tag}
                              onClick={() => setFilterTag(tag)}
                            >
                              #{tag}
                            </Tag>
                          ))}
                        </TagsContainer>
                      </CardSetContent>
                      
                      <ActionButtons>
                        <StudyButton 
                          onClick={() => startStudying(set.id)}
                          $accentColor={getSubjectColor(set.subject)}
                        >
                          Study Now
                        </StudyButton>
                        <SecondaryButtonGroup>
                          <IconButton aria-label="Edit flashcard set">
                            <FiEdit />
                          </IconButton>
                          <IconButton aria-label="Share flashcard set">
                            <FiShare2 />
                          </IconButton>
                        </SecondaryButtonGroup>
                      </ActionButtons>
                    </CardSetBox>
                  ))}
                </CardSetsGrid>
              )}
            </ContentContainer>
          </motion.div>
        ) : (
          <motion.div
            key="study-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <StudyHeader>
              <BackButtonContainer>
                <BackButton onClick={backToSets}>
                  <FiChevronLeft />
                  <span>Back to Sets</span>
                </BackButton>
              </BackButtonContainer>
              
              <StudyTitleContainer>
                <StudySetSubject $color={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}>
                  {activeSet?.subject}
                </StudySetSubject>
                <StudyTitle>{activeSet?.title}</StudyTitle>
              </StudyTitleContainer>
              
              <StudyProgressContainer>
                <ProgressTracker>
                  <ProgressText>
                    <span>Card</span>
                    <ProgressNumbers>
                      <CurrentNumber>{currentCardIndex + 1}</CurrentNumber>
                      <span>/</span>
                      <TotalNumber>{activeSetCards.length}</TotalNumber>
                    </ProgressNumbers>
                  </ProgressText>
                  <ProgressBar>
                    <ProgressFill
                      width={activeSetCards.length ? ((currentCardIndex + 1) / activeSetCards.length) * 100 : 0}
                      $accentColor={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}
                    />
                  </ProgressBar>
                </ProgressTracker>
                
                <MasteryTracker>
                  <FiAward />
                  <span>{masteredCards.size} of {activeSetCards.length} mastered</span>
                </MasteryTracker>
              </StudyProgressContainer>
            </StudyHeader>
            
            <StudyContent>
              {activeSetCards.length > 0 && (
                <FlashcardContainer>
                  <FlashcardWrapper>
                    <Flashcard
                      ref={cardRef}
                      onClick={() => handleFlipCard(activeSetCards[currentCardIndex].id)}
                      $color={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}
                    >
                      <CardFace
                        initial={false}
                        animate={{ 
                          rotateY: flippedCards.has(activeSetCards[currentCardIndex].id) ? 180 : 0,
                          boxShadow: flippedCards.has(activeSetCards[currentCardIndex].id) 
                            ? '0 15px 25px rgba(0, 0, 0, 0.05)' 
                            : '0 10px 30px rgba(0, 0, 0, 0.1)'
                        }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        $side="front"
                        $color={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}
                      >
                        <CardSideLabel>Question</CardSideLabel>
                        <CardContent>
                          <CardText>{activeSetCards[currentCardIndex].question}</CardText>
                        </CardContent>
                        <FlipPrompt>
                          <FlipIcon>↻</FlipIcon>
                          <span>Click to flip</span>
                        </FlipPrompt>
                      </CardFace>
                      
                      <CardFace
                        initial={false}
                        animate={{ 
                          rotateY: flippedCards.has(activeSetCards[currentCardIndex].id) ? 0 : -180,
                          boxShadow: flippedCards.has(activeSetCards[currentCardIndex].id) 
                            ? '0 10px 30px rgba(0, 0, 0, 0.1)' 
                            : '0 15px 25px rgba(0, 0, 0, 0.05)'
                        }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        $side="back"
                        $color={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}
                      >
                        <CardSideLabel>Answer</CardSideLabel>
                        <CardContent>
                          <CardText>{activeSetCards[currentCardIndex].answer}</CardText>
                        </CardContent>
                        <FlipPrompt>
                          <FlipIcon>↻</FlipIcon>
                          <span>Click to flip</span>
                        </FlipPrompt>
                      </CardFace>
                    </Flashcard>

                    <CardCounter>
                      {Array.from({ length: activeSetCards.length }).map((_, index) => (
                        <CardDot 
                          key={index} 
                          $isActive={index === currentCardIndex}
                          $isMastered={masteredCards.has(activeSetCards[index].id)}
                          $color={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}
                        />
                      ))}
                    </CardCounter>
                  </FlashcardWrapper>
                  
                  <NavigationButtons>
                    <NavButton 
                      onClick={goToPrevCard} 
                      disabled={currentCardIndex === 0}
                    >
                      <FiChevronLeft />
                      <span>Previous</span>
                    </NavButton>
                    
                    <MasteryButton
                      onClick={() => toggleCardMastery(activeSetCards[currentCardIndex].id)}
                      $isMastered={masteredCards.has(activeSetCards[currentCardIndex].id)}
                      $color={activeSet ? getSubjectColor(activeSet.subject) : '#6B7280'}
                      as={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {masteredCards.has(activeSetCards[currentCardIndex].id) ? (
                        <>
                          <FiX />
                          <span>Remove Mastered</span>
                        </>
                      ) : (
                        <>
                          <FiCheck />
                          <span>Mark as Mastered</span>
                        </>
                      )}
                    </MasteryButton>
                    
                    <NavButton 
                      onClick={goToNextCard} 
                      disabled={currentCardIndex === activeSetCards.length - 1}
                    >
                      <span>Next</span>
                      <FiChevronRight />
                    </NavButton>
                  </NavigationButtons>
                </FlashcardContainer>
              )}
            </StudyContent>
            
            <StudyOptions>
              <EditCardButton>
                <FiEdit />
                <span>Edit Current Card</span>
              </EditCardButton>
              <AddCardButton>
                <FiPlus />
                <span>Add New Card</span>
              </AddCardButton>
            </StudyOptions>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: ${({ theme }) => theme.colors.text.primary};
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, #764BA2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const PageDescription = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background-color: ${({ theme }) => theme.colors.border.light};
`;

const ContentContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const TopControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchFilter = styled.div`
  display: flex;
  flex: 1;
  gap: 16px;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 18px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}30`};
  }
`;

const FilterWrapper = styled.div`
  position: relative;
  min-width: 180px;
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 18px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.background.primary};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  appearance: none;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}30`};
  }
`;

const NewSetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary}e0;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${({ theme }) => `${theme.colors.primary}40`};
  }
  
  svg {
    font-size: 18px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const CardSetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  padding: 24px;
`;

interface CardSetBoxProps {
  $accentColor: string;
}

const CardSetBox = styled(motion.div)<CardSetBoxProps>`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-top: 5px solid ${props => props.$accentColor};
  display: flex;
  flex-direction: column;
  
  &:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CardSetContent = styled.div`
  padding: 20px;
  flex: 1;
`;

const SetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

interface SubjectBadgeProps {
  $bgColor: string;
}

const SubjectBadge = styled.div<SubjectBadgeProps>`
  background-color: ${props => `${props.$bgColor}15`};
  color: ${props => props.$bgColor};
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
`;

const CardCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    font-size: 14px;
  }
`;

const CardSetTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
`;

const ProgressSection = styled.div`
  margin-bottom: 16px;
`;

const ProgressBarWrapper = styled.div`
  margin-bottom: 10px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProgressBar = styled.div`
  height: 8px;
  width: 100%;
  background: ${({ theme }) => theme.colors.background.hover};
  border-radius: 4px;
  overflow: hidden;
`;

interface ProgressFillProps {
  width: number;
  $accentColor: string;
}

const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => props.$accentColor};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const LastStudiedWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    font-size: 14px;
  }
`;

const LastStudied = styled.span``;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  min-height: 28px;
`;

const Tag = styled.span`
  padding: 4px 8px;
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

interface StudyButtonProps {
  $accentColor: string;
}

const StudyButton = styled.button<StudyButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: ${props => props.$accentColor};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 150px;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${props => `${props.$accentColor}40`};
  }
`;

const SecondaryButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EmptyStateIcon = styled.div`
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: 16px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
`;

const EmptyStateDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 24px 0;
  max-width: 400px;
`;

const CreateNewButton = styled(NewSetButton)`
  margin: 0 auto;
`;

// Study view styled components
const StudyHeader = styled.div`
  margin-bottom: 32px;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const BackButtonContainer = styled.div`
  justify-self: start;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 8px;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    font-size: 18px;
  }
`;

const StudyTitleContainer = styled.div`
  text-align: center;
  justify-self: center;
`;

interface StudySetSubjectProps {
  $color: string;
}

const StudySetSubject = styled.div<StudySetSubjectProps>`
  color: ${props => props.$color};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const StudyTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const StudyProgressContainer = styled.div`
  justify-self: end;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ProgressTracker = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProgressNumbers = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CurrentNumber = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 15px;
`;

const TotalNumber = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const MasteryTracker = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    color: ${({ theme }) => theme.colors.warning};
  }
`;

const StudyContent = styled.div`
  margin-bottom: 32px;
`;

const FlashcardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`;

const FlashcardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
`;

interface FlashcardProps {
  $color: string;
}

const Flashcard = styled.div<FlashcardProps>`
  position: relative;
  width: 100%;
  height: 400px;
  perspective: 2000px;
  cursor: pointer;
  transform-style: preserve-3d;
  
  @media (max-width: 768px) {
    height: 300px;
  }
`;

interface CardFaceProps {
  $side: 'front' | 'back';
  $color: string;
}

const CardFace = styled(motion.div)<CardFaceProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  padding: 24px;
  border-top: 5px solid ${props => props.$color};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  will-change: transform;
  transform: ${props => props.$side === 'back' ? 'rotateY(180deg)' : 'rotateY(0)'};
`;

const CardSideLabel = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.tertiary};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 4px 8px;
  border-radius: 12px;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex: 1;
  width: 100%;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.light};
    border-radius: 3px;
  }
`;

const CardText = styled.div`
  font-size: 22px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 16px;
  width: 100%;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const FlipPrompt = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.tertiary};
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin-top: 16px;
`;

const FlipIcon = styled.span`
  display: inline-block;
  transform: rotate(30deg);
  font-size: 16px;
`;

const CardCounter = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 100%;
  padding: 0 16px;
`;

interface CardDotProps {
  $isActive: boolean;
  $isMastered: boolean;
  $color: string;
}

const CardDot = styled.div<CardDotProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.$isActive) return props.$color;
    if (props.$isMastered) return '#10B981'; // Green for mastered
    return props.theme.colors.background.hover;
  }};
  border: 1px solid ${props => {
    if (props.$isActive) return props.$color;
    if (props.$isMastered) return '#10B981'; // Green for mastered
    return props.theme.colors.border.light;
  }};
  transition: all 0.2s ease;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 640px;
  gap: 16px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 576px) {
    width: 100%;
  }
`;

interface MasteryButtonProps {
  $isMastered: boolean;
  $color: string;
}

const MasteryButton = styled.button<MasteryButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${props => props.$isMastered ? '#10B981' : props.$color};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 300px;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${props => props.$isMastered ? 'rgba(16, 185, 129, 0.4)' : `${props.$color}40`};
  }
  
  @media (max-width: 576px) {
    width: 100%;
    max-width: none;
  }
`;

const StudyOptions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const EditCardButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.border};
  }
  
  @media (max-width: 576px) {
    width: 100%;
  }
`;

const AddCardButton = styled(EditCardButton)``;

export default Flashcards; 