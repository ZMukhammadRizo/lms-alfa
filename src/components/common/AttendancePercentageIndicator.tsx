import React from 'react'
import styled from 'styled-components'

interface AttendancePercentageIndicatorProps {
	percentage: number
	showLabel?: boolean
	size?: 'sm' | 'md' | 'lg'
}

/**
 * A reusable component that displays attendance percentage with appropriate color indicators
 * - Red: 0% - 50%
 * - Orange: 51% - 70%
 * - Yellow: 71% - 80%
 * - Green: 81% - 100%
 */
const AttendancePercentageIndicator: React.FC<AttendancePercentageIndicatorProps> = ({
	percentage,
	showLabel = true,
	size = 'md',
}) => {
	// Handle invalid percentage values
	const validPercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage))

	// Determine color based on percentage
	const getColor = (percent: number): string => {
		if (percent <= 50) return '#ef4444' // Red
		if (percent <= 70) return '#f97316' // Orange
		if (percent <= 80) return '#eab308' // Yellow
		return '#22c55e' // Green
	}

	const color = getColor(validPercentage)

	return (
		<Container>
			{showLabel && (
				<Label $color={color} $size={size}>
					{Math.round(validPercentage)}%
				</Label>
			)}
			<IndicatorWrapper $size={size}>
				<Indicator $color={color} $percentage={validPercentage} $size={size} />
			</IndicatorWrapper>
		</Container>
	)
}

const Container = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

interface LabelProps {
	$color: string
	$size: string
}

const Label = styled.span<LabelProps>`
	font-weight: 600;
	color: ${props => props.$color};
	font-size: ${props => {
		switch (props.$size) {
			case 'sm':
				return '0.75rem'
			case 'lg':
				return '1.125rem'
			default:
				return '0.875rem'
		}
	}};
`

interface IndicatorWrapperProps {
	$size: string
}

const IndicatorWrapper = styled.div<IndicatorWrapperProps>`
	background-color: #e5e7eb;
	border-radius: 9999px;
	height: ${props => {
		switch (props.$size) {
			case 'sm':
				return '4px'
			case 'lg':
				return '8px'
			default:
				return '6px'
		}
	}};
	width: ${props => {
		switch (props.$size) {
			case 'sm':
				return '40px'
			case 'lg':
				return '80px'
			default:
				return '60px'
		}
	}};
	overflow: hidden;
`

interface IndicatorProps {
	$color: string
	$percentage: number
	$size: string
}

const Indicator = styled.div<IndicatorProps>`
	background-color: ${props => props.$color};
	height: 100%;
	width: ${props => `${props.$percentage}%`};
	border-radius: 9999px;
	transition: width 0.3s ease, background-color 0.3s ease;
`

export default AttendancePercentageIndicator
