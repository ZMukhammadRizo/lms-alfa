import React from 'react'
import styled from 'styled-components'

interface PageHeaderProps {
	title: string
	subtitle?: string
	children?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
	return (
		<HeaderContainer>
			<HeaderContent>
				<HeaderTitle>{title}</HeaderTitle>
				{subtitle && <HeaderSubtitle>{subtitle}</HeaderSubtitle>}
			</HeaderContent>
			{children && <HeaderActions>{children}</HeaderActions>}
		</HeaderContainer>
	)
}

const HeaderContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
`

const HeaderContent = styled.div`
	flex: 1;
`

const HeaderTitle = styled.h1`
	margin: 0;
	font-size: 1.8rem;
	font-weight: 600;
	color: var(--color-text-primary);
`

const HeaderSubtitle = styled.p`
	margin: 4px 0 0;
	font-size: 1rem;
	color: var(--color-text-secondary);
`

const HeaderActions = styled.div`
	display: flex;
	gap: 12px;

	@media (max-width: 768px) {
		width: 100%;
		justify-content: flex-start;
	}
`

export default PageHeader
