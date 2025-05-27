import React from 'react'
import { hasPermission } from '../../utils/authUtils'

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	permission: string
	fallbackTooltip?: string
	hideWhenDisabled?: boolean
}

/**
 * A button component that's conditionally enabled based on user permissions.
 * If the user doesn't have the required permission, the button is disabled
 * or hidden based on the hideWhenDisabled prop.
 *
 * @example
 * <PermissionButton
 *   permission="create_classes"
 *   className="btn btn-primary"
 *   onClick={handleAddClass}
 *   fallbackTooltip="You don't have permission to create classes"
 * >
 *   Add New Class
 * </PermissionButton>
 */
const PermissionButton: React.FC<PermissionButtonProps> = ({
	permission,
	fallbackTooltip,
	hideWhenDisabled = false,
	children,
	...buttonProps
}) => {
	const hasAccess = hasPermission(permission)

	if (!hasAccess && hideWhenDisabled) {
		return null
	}

	return (
		<button
			{...buttonProps}
			disabled={!hasAccess || buttonProps.disabled}
			title={!hasAccess ? fallbackTooltip : buttonProps.title}
			aria-disabled={!hasAccess || buttonProps.disabled}
		>
			{children}
		</button>
	)
}

export default PermissionButton
