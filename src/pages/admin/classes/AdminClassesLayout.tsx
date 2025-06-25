import React from 'react'
import { Outlet } from 'react-router-dom'
import ClassesBreadcrumb from './components/ClassesBreadcrumb'

const AdminClassesLayout: React.FC = () => {
	return (
		<div>
			<ClassesBreadcrumb />
			<Outlet />
		</div>
	)
}

export default AdminClassesLayout
