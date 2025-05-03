import React from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiX, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onCancel}
          />
          <ModalContainer
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <ModalHeader $isDanger={isDanger}>
              <HeaderTitle>
                {isDanger && <AlertIcon><FiAlertTriangle /></AlertIcon>}
                {title}
              </HeaderTitle>
              <CloseButton onClick={isLoading ? undefined : onCancel} disabled={isLoading}>
                <FiX />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <MessageText>{message}</MessageText>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={isLoading ? undefined : onCancel} disabled={isLoading}>
                {cancelText}
              </CancelButton>
              <ConfirmButton 
                onClick={isLoading ? undefined : onConfirm} 
                $isDanger={isDanger}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingIcon className="spin"><FiLoader /></LoadingIcon>
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </>
      )}
    </AnimatePresence>
  );
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${props => props.theme.zIndices.modal - 1};
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 450px;
  width: 90%;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: ${props => props.theme.zIndices.modal};
`;

interface HeaderProps {
  $isDanger: boolean;
}

const ModalHeader = styled.div<HeaderProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  color: ${props => props.$isDanger ? props.theme.colors.danger[600] : props.theme.colors.text.primary};
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlertIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${props => props.theme.colors.danger[500]};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 1rem;
`;

const MessageText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${props => props.theme.colors.text.secondary};
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid ${props => props.theme.colors.border.light};
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 4px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  
  &.spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface ConfirmButtonProps {
  $isDanger: boolean;
  disabled?: boolean;
}

const ConfirmButton = styled.button<ConfirmButtonProps>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.$isDanger 
    ? props.theme.colors.danger[500] 
    : props.theme.colors.primary[500]
  };
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.$isDanger 
      ? props.theme.colors.danger[600] 
      : props.theme.colors.primary[600]
    };
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default ConfirmationModal; 