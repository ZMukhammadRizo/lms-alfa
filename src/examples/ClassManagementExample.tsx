import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { PermissionGuard } from '../components/permissions/PermissionGuard'
import { withPermissionCheck, withAnyPermissionCheck } from '../utils/permissionUtils'
import supabase from '../config/supabaseClient'

/**
 * This is a comprehensive example of how to use the permission system
 * throughout a component with various UI elements and actions.
 */
const ClassManagementExample: React.FC = () => {
	const [classes, setClasses] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [selectedClass, setSelectedClass] = useState<any>(null)
	const [formData, setFormData] = useState({ name: '', description: '' })

	// Load classes on component mount
	useEffect(() => {
		fetchClasses()
	}, [])

	/**
	 * Permission-protected fetch classes function
	 * Uses withPermissionCheck to ensure the user has appropriate permissions
	 */
	const fetchClasses = async () => {
		setLoading(true)
		await withPermissionCheck(
			'read_classes',
			async () => {
				try {
					const { data, error } = await supabase.from('classes').select('*')

					if (error) {
						throw error
					}

					setClasses(data || [])
				} catch (error) {
					console.error('Error fetching classes:', error)
					toast.error('Failed to load classes')
				} finally {
					setLoading(false)
				}
			},
			// This function runs if permission is denied
			() => {
				toast.error('You do not have permission to view classes')
				setLoading(false)
			}
		)
	}

	/**
	 * Permission-protected function to create a new class
	 * Uses withPermissionCheck to ensure the user has appropriate permissions
	 */
	const createClass = async () => {
		await withPermissionCheck(
			'create_classes',
			async () => {
				try {
					const { data, error } = await supabase
						.from('classes')
						.insert([formData])
						.select()

					if (error) {
						throw error
					}

					toast.success('Class created successfully')
					setFormData({ name: '', description: '' })
					fetchClasses()
				} catch (error) {
					console.error('Error creating class:', error)
					toast.error('Failed to create class')
				}
			},
			// This function runs if permission is denied
			() => {
				toast.error('You do not have permission to create classes')
			}
		)
	}

	/**
	 * Permission-protected function to update a class
	 * Uses withPermissionCheck to ensure the user has appropriate permissions
	 */
	const updateClass = async () => {
		if (!selectedClass) return

		await withPermissionCheck(
			'update_classes',
			async () => {
				try {
					const { error } = await supabase
						.from('classes')
						.update(formData)
						.eq('id', selectedClass.id)

					if (error) {
						throw error
					}

					toast.success('Class updated successfully')
					setSelectedClass(null)
					setFormData({ name: '', description: '' })
					fetchClasses()
				} catch (error) {
					console.error('Error updating class:', error)
					toast.error('Failed to update class')
				}
			},
			// This function runs if permission is denied
			() => {
				toast.error('You do not have permission to update classes')
			}
		)
	}

	/**
	 * Permission-protected function to delete a class
	 * Uses withPermissionCheck to ensure the user has appropriate permissions
	 */
	const deleteClass = async (classId: string) => {
		await withPermissionCheck(
			'delete_classes',
			async () => {
				try {
					const { error } = await supabase.from('classes').delete().eq('id', classId)

					if (error) {
						throw error
					}

					toast.success('Class deleted successfully')
					fetchClasses()
				} catch (error) {
					console.error('Error deleting class:', error)
					toast.error('Failed to delete class')
				}
			},
			// This function runs if permission is denied
			() => {
				toast.error('You do not have permission to delete classes')
			}
		)
	}

	/**
	 * Example of using withAnyPermissionCheck for actions that can be performed
	 * with any of multiple permissions
	 */
	const exportClassData = async (classId: string) => {
		await withAnyPermissionCheck(
			['export_data', 'generate_grade_reports'],
			async () => {
				try {
					// Code to export class data
					toast.success('Class data exported successfully')
				} catch (error) {
					console.error('Error exporting class data:', error)
					toast.error('Failed to export class data')
				}
			},
			// This function runs if all permissions are denied
			() => {
				toast.error('You do not have permission to export class data')
			}
		)
	}

	const selectClassForEdit = (classItem: any) => {
		setSelectedClass(classItem)
		setFormData({
			name: classItem.name,
			description: classItem.description
		})
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Class Management Example</h1>

			{/* Class Form Section - Only visible with create_classes or update_classes permission */}
			<PermissionGuard
				permission={['create_classes', 'update_classes']}
				fallback={<p className="text-gray-500">You don't have permission to manage classes.</p>}
			>
				<div className="bg-white shadow-md rounded p-4 mb-6">
					<h2 className="text-xl font-semibold mb-2">
						{selectedClass ? 'Edit Class' : 'Create New Class'}
					</h2>
					<div className="mb-4">
						<label className="block text-gray-700">Class Name</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							className="border rounded w-full p-2"
						/>
					</div>
					<div className="mb-4">
						<label className="block text-gray-700">Description</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							className="border rounded w-full p-2"
							rows={3}
						/>
					</div>
					<div className="flex space-x-2">
						{selectedClass ? (
							<>
								{/* Update button - only visible with update_classes permission */}
								<PermissionGuard permission="update_classes">
									<button
										onClick={updateClass}
										className="bg-blue-500 text-white px-4 py-2 rounded"
									>
										Update Class
									</button>
								</PermissionGuard>
								<button
									onClick={() => {
										setSelectedClass(null)
										setFormData({ name: '', description: '' })
									}}
									className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
								>
									Cancel
								</button>
							</>
						) : (
							/* Create button - only visible with create_classes permission */
							<PermissionGuard permission="create_classes">
								<button
									onClick={createClass}
									className="bg-green-500 text-white px-4 py-2 rounded"
								>
									Create Class
								</button>
							</PermissionGuard>
						)}
					</div>
				</div>
			</PermissionGuard>

			{/* Class List Section - Only visible with read_classes permission */}
			<PermissionGuard permission="read_classes">
				<div className="bg-white shadow-md rounded p-4">
					<h2 className="text-xl font-semibold mb-4">Classes</h2>

					{loading ? (
						<p>Loading classes...</p>
					) : classes.length === 0 ? (
						<p>No classes found.</p>
					) : (
						<div className="space-y-4">
							{classes.map(classItem => (
								<div
									key={classItem.id}
									className="border p-3 rounded flex justify-between items-center"
								>
									<div>
										<h3 className="font-semibold">{classItem.name}</h3>
										<p className="text-gray-600">{classItem.description}</p>
									</div>
									<div className="flex space-x-2">
										{/* Edit button - only visible with update_classes permission */}
										<PermissionGuard permission="update_classes">
											<button
												onClick={() => selectClassForEdit(classItem)}
												className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md"
											>
												Edit
											</button>
										</PermissionGuard>

										{/* Delete button - only visible with delete_classes permission */}
										<PermissionGuard permission="delete_classes">
											<button
												onClick={() => deleteClass(classItem.id)}
												className="bg-red-100 text-red-700 px-3 py-1 rounded-md"
											>
												Delete
											</button>
										</PermissionGuard>

										{/* Export button - visible with either export_data or generate_grade_reports permission */}
										<PermissionGuard permission={['export_data', 'generate_grade_reports']}>
											<button
												onClick={() => exportClassData(classItem.id)}
												className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md"
											>
												Export
											</button>
										</PermissionGuard>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</PermissionGuard>
		</div>
	)
}

export default ClassManagementExample
