import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import styled from 'styled-components'

interface AccessDeniedProps {
	permission?: string
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ permission }) => {
	return (
		<Container>
			<IconWrapper>
				<FiAlertTriangle size={48} />
			</IconWrapper>
			<Title>Access Denied</Title>
			<Message>You don't have permission to access this page.</Message>
		</Container>
	)
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem;
	text-align: center;
	height: 100%;
	min-height: 400px;
`

const IconWrapper = styled.div`
	color: ${props => props.theme.colors.warning[500]};
	margin-bottom: 1.5rem;
`

const Title = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: ${props => props.theme.colors.text.primary};
`

const Message = styled.p`
	font-size: 1.1rem;
	color: ${props => props.theme.colors.text.secondary};
	max-width: 500px;
`

const PermissionText = styled.div`
	margin-top: 1rem;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.tertiary};

	code {
		background: ${props => props.theme.colors.background.tertiary};
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: monospace;
	}
`

export default AccessDenied
