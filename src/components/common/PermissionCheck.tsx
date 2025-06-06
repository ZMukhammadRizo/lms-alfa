import React from 'react'
import styled, { keyframes } from 'styled-components'

// Spinner animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

// Styled container
const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 80vh;
	text-align: center;
	gap: 1rem;
	color: #4a90e2;
`

// Spinner circle
const Spinner = styled.div`
	border: 6px solid #e0f0ff;
	border-top: 6px solid #4a90e2;
	border-radius: 50%;
	width: 50px;
	height: 50px;
	animation: ${spin} 1s linear infinite;
`

// Message
const Message = styled.h2`
	font-size: 1.5rem;
	font-weight: 500;
	margin: 0;
	animation: pulse 1s ease-in-out infinite alternate;

	@keyframes pulse {
		from {
			opacity: 0.6;
			transform: scale(0.98);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
`

const Emoji = styled.div`
	font-size: 2rem;
`

export const CheckingPermission: React.FC = () => {
	return (
		<Wrapper>
			<Spinner />
			<Message>Checking permissions... Hang tight! 🔐</Message>
			<Emoji>🌈✨</Emoji>
		</Wrapper>
	)
}
