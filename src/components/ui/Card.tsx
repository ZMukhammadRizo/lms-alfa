import styled from 'styled-components';

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.card || 'white'};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

export default Card; 