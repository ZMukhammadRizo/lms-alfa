import React from 'react';
import styled from 'styled-components';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <SwitchContainer $disabled={disabled}>
      <SwitchInput 
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
        disabled={disabled} 
      />
      <SwitchSlider $checked={checked} $disabled={disabled} />
    </SwitchContainer>
  );
};

interface SwitchContainerProps {
  $disabled: boolean;
}

const SwitchContainer = styled.label<SwitchContainerProps>`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.6 : 1};
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

interface SwitchSliderProps {
  $checked: boolean;
  $disabled: boolean;
}

const SwitchSlider = styled.span<SwitchSliderProps>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.$checked 
    ? props.theme?.colors?.primary?.[500] || '#1890ff' 
    : props.theme?.colors?.border?.light || '#d9d9d9'};
  border-radius: 24px;
  transition: 0.4s;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: 0.4s;
    transform: ${props => props.$checked ? 'translateX(20px)' : 'translateX(0)'};
  }
`;

export default Switch; 