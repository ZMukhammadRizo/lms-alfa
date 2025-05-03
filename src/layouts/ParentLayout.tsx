import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useAnnouncements } from '../stores/useAnnouncementStore';
import Header from '../components/admin/Header';
import Footer from '../components/admin/Footer';
import ParentSidebar from '../components/parent/ParentSidebar';

// Error boundary for handling rendering errors
class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by ErrorBoundary:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
	return (
				<div style={{ 
					padding: '20px', 
					display: 'flex', 
					flexDirection: 'column', 
					alignItems: 'center', 
					justifyContent: 'center', 
					height: '100vh' 
				}}>
					<h2>Something went wrong.</h2>
					<p>Please try refreshing the page or contact support if the issue persists.</p>
					<button 
						onClick={() => window.location.reload()} 
						style={{
							padding: '8px 16px',
							background: '#1976d2',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							marginTop: '20px'
						}}
					>
						Refresh Page
					</button>
				</div>
	);
		}

		return this.props.children;
	}
}

const ParentLayout: React.FC = () => {
	const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const { user } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const {
		announcements,
		unreadCount,
		markAsRead: markAnnouncementAsRead,
		markAllAsRead,
		fetchAnnouncements,
	} = useAnnouncements();

	// Get parent announcements - both All and Parent targeted announcements
	const parentAnnouncements = announcements?.filter(
		announcement =>
			announcement?.targetAudience?.toLowerCase() === 'all' ||
			announcement?.targetAudience?.toLowerCase() === 'parent'
	) || [];

	// Get most recent 3 announcements sorted by creation date
	const recentAnnouncements = [...parentAnnouncements]
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 3);

	useEffect(() => {
		try {
		// Fetch announcements for Parent role
		fetchAnnouncements('Parent');

		// Refresh announcements every 5 minutes
		const intervalId = setInterval(() => {
			fetchAnnouncements('Parent');
		}, 300000); // 5 minutes

		return () => clearInterval(intervalId);
		} catch (error) {
			console.error("Error fetching announcements:", error);
		}
	}, [fetchAnnouncements]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 1024) {
				setSidebarCollapsed(true);
			}
		};

		// Initial check
		handleResize();

		// Add resize listener
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const toggleSidebar = () => {
		setSidebarCollapsed(!isSidebarCollapsed);
	};

	const handleMobileToggle = (isOpen: boolean) => {
		setMobileSidebarOpen(isOpen);
	};

	// Close notifications on route change
	useEffect(() => {
		setShowNotifications(false);
		setShowUserDropdown(false);
	}, [location.pathname]);

	return (
		<ErrorBoundary>
			<ParentLayoutContainer>
				<ParentSidebar 
					isCollapsed={isSidebarCollapsed} 
					toggleSidebar={toggleSidebar} 
					onMobileToggle={handleMobileToggle}
				/>
				<MainContent $isCollapsed={isSidebarCollapsed} $isMobileOpen={isMobileSidebarOpen}>
					<Header />
					<ContentWrapper>
						<ErrorBoundary>
					<Outlet />
						</ErrorBoundary>
					</ContentWrapper>
					<Footer />
				</MainContent>
			</ParentLayoutContainer>
		</ErrorBoundary>
	);
};

const ParentLayoutContainer = styled.div`
	display: flex;
	height: 100vh;
	width: 100%;
	background-color: ${props => props.theme?.colors?.background?.primary || '#f5f5f5'};
`;

interface MainContentProps {
	$isCollapsed: boolean;
	$isMobileOpen: boolean;
}

const MainContent = styled.div<MainContentProps>`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-x: hidden;
	transition: margin-left ${props => props.theme?.transition?.normal || '0.3s ease'}, 
				filter ${props => props.theme?.transition?.normal || '0.3s ease'},
				opacity ${props => props.theme?.transition?.normal || '0.3s ease'};
	z-index: ${props => props.theme?.zIndices?.base || 1};
	position: relative;
	margin-left: ${({ $isCollapsed }) => ($isCollapsed ? '80px' : '280px')};
	
	@media (max-width: ${props => props.theme?.breakpoints?.lg || '1024px'}) {
		margin-left: 0;
		filter: ${({ $isMobileOpen }) => $isMobileOpen ? 'blur(4px)' : 'none'};
		opacity: ${({ $isMobileOpen }) => $isMobileOpen ? 0.7 : 1};
		pointer-events: ${({ $isMobileOpen }) => $isMobileOpen ? 'none' : 'auto'};
	}
`;

const ContentWrapper = styled.main`
	flex: 1;
	padding: 24px 32px;
	overflow-y: auto;
	background-color: ${props => props.theme?.colors?.background?.secondary || '#ffffff'};
`;

export default ParentLayout;


