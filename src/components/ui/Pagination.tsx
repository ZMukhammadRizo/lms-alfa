import React from 'react';
import styled from 'styled-components';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited number of pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In the middle
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <PaginationContainer>
      <PaginationButton 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
      >
        <i className="fas fa-chevron-left"></i>
      </PaginationButton>
      
      {pageNumbers.map((page, index) => 
        page === 'ellipsis' ? (
          <Ellipsis key={`ellipsis-${index}`}>...</Ellipsis>
        ) : (
          <PageNumber 
            key={page} 
            $isActive={page === currentPage}
            onClick={() => typeof page === 'number' && onPageChange(page)}
          >
            {page}
          </PageNumber>
        )
      )}
      
      <PaginationButton 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
      >
        <i className="fas fa-chevron-right"></i>
      </PaginationButton>
    </PaginationContainer>
  );
};

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaginationButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.neutral[100] || '#f3f4f6'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageNumber = styled.button<{ $isActive?: boolean }>`
  background: ${({ $isActive, theme }) => $isActive 
    ? theme.colors.primary[500] || '#3b82f6' 
    : 'transparent'
  };
  color: ${({ $isActive, theme }) => $isActive 
    ? 'white' 
    : theme.colors.text || '#1f2937'
  };
  border: 1px solid ${({ $isActive, theme }) => $isActive 
    ? 'transparent' 
    : theme.colors.border || '#e5e7eb'
  };
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: ${({ $isActive }) => $isActive ? '600' : '400'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${({ $isActive, theme }) => $isActive 
      ? theme.colors.primary[600] || '#2563eb'
      : theme.colors.neutral[100] || '#f3f4f6'
    };
  }
`;

const Ellipsis = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default Pagination; 