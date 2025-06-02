import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { usePermissionStore } from '../../stores/permissionStore'
import { checkUserPermission } from '../../utils/permissionUtils'

interface PagePermissionCheckProps {
	children: React.ReactNode
	path: string
}

const PagePermissionCheck: React.FC<PagePermissionCheckProps> = ({ children, path }) => {
	const { loading } = usePermissionStore()
	const [isChecking, setIsChecking] = useState(true)
	const [hasAccess, setHasAccess] = useState(false)

	if (path.includes('teacher') || path.includes('student') || path.includes('parent')) {
		return <>{children}</>
	}

	useEffect(() => {
		const checkAccess = async () => {
			setIsChecking(true)
			const access = await checkUserPermission(path)
			setHasAccess(access)
			setIsChecking(false)
		}

		checkAccess()
	}, [path, checkUserPermission])

	if (isChecking || loading) {
		return (
			<>
				<LoadingOverlay>
					<LoadingText>Checking permissions...</LoadingText>
				</LoadingOverlay>
				{children}
			</>
		)
	}

	if (!hasAccess) {
		return (
			<UnauthorizedContainer>
				<UnauthorizedContent>
					<h2>Access Denied</h2>
					<p>You don't have permission to access this page. asdadasd</p>
				</UnauthorizedContent>
			</UnauthorizedContainer>
		)
	}

	return <>{children}</>
}

const LoadingOverlay = styled.div`
	position: fixed;
	top: 1rem;
	right: 1rem;
	background-color: ${props => props.theme.colors.background.primary};
	padding: 0.5rem 1rem;
	border-radius: ${props => props.theme.borderRadius.md};
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	z-index: 1000;
`

const LoadingText = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.875rem;
	margin: 0;
`

const UnauthorizedContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	padding: 2rem;
`

const UnauthorizedContent = styled.div`
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};

	h2 {
		color: ${props => props.theme.colors.text.primary};
		margin-bottom: 1rem;
	}

	p {
		margin: 0;
	}
`

export default PagePermissionCheck
