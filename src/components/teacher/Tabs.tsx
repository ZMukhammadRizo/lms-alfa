import React from 'react'
import styled from 'styled-components'
import { TabProvider, useTab } from './TabContext'

const TabListWrapper = styled.div`
	display: flex;
	border-bottom: 2px solid ${props => props.theme.colors.border.light};
	margin-bottom: 1rem;
`

const TabButton = styled.button<{ $active: boolean }>`
	flex: 1;
	padding: 0.75rem 1rem;
	background: ${({ $active, theme }) =>
		$active ? theme.colors.background.primary : theme.colors.background.secondary};
	border: none;
	border-bottom: ${({ $active, theme }) =>
		$active ? `3px solid ${theme.colors.primary[500]}` : '3px solid transparent'};
	font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
	cursor: pointer;
	color: ${props => props.theme.colors.text.primary};

	&:hover {
		background: ${props => props.theme.colors.background.hover};
	}
`

const PanelWrapper = styled.div`
	padding: 1rem;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	width: 100%;
`

type TabsProps = {
	tabs: string[]
	children: React.ReactNode[]
}

export const Tabs: React.FC<TabsProps> = ({ tabs, children }) => (
	<TabProvider>
		<TabList labels={tabs} />
		<TabPanels>{children}</TabPanels>
	</TabProvider>
)

interface TabListProps {
	labels: string[]
}

const TabList: React.FC<TabListProps> = ({ labels }) => {
	const { activeIndex, setActiveIndex } = useTab()
	return (
		<TabListWrapper>
			{labels.map((label, i) => (
				<TabButton key={i} $active={i === activeIndex} onClick={() => setActiveIndex(i)}>
					{label}
				</TabButton>
			))}
		</TabListWrapper>
	)
}

interface TabPanelsProps {
	children: React.ReactNode
}

const TabPanels: React.FC<TabPanelsProps> = ({ children }) => {
	const { activeIndex } = useTab()
	return <PanelWrapper>{React.Children.toArray(children)[activeIndex]}</PanelWrapper>
}
