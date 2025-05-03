import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	TextField,
	Typography,
} from '@mui/material'
import React, { useEffect, useState } from 'react'

interface GradeDialogProps {
	open: boolean
	onClose: () => void
	onSave: (value: string | number) => void
	currentValue?: string | number
	studentName: string
	lessonDate: string
}

const GradeDialog: React.FC<GradeDialogProps> = ({
	open,
	onClose,
	onSave,
	currentValue = '',
	studentName,
	lessonDate,
}) => {
	const [inputType, setInputType] = useState<'grade' | 'status'>('grade')
	const [gradeValue, setGradeValue] = useState<string>('')
	const [statusValue, setStatusValue] = useState<string>('A')

	useEffect(() => {
		if (open) {
			// Initialize with current value if exists
			if (currentValue !== undefined && currentValue !== '') {
				if (typeof currentValue === 'number' || !isNaN(Number(currentValue))) {
					setInputType('grade')
					setGradeValue(String(currentValue))
				} else {
					setInputType('status')
					setStatusValue(String(currentValue))
				}
			} else {
				// Default to empty grade
				setInputType('grade')
				setGradeValue('')
				setStatusValue('A')
			}
		}
	}, [open, currentValue])

	const handleSave = () => {
		if (inputType === 'grade') {
			if (gradeValue.trim() === '') {
				// If grade is empty, don't save
				onClose()
				return
			}
			onSave(Number(gradeValue))
		} else {
			onSave(statusValue)
		}
		onClose()
	}

	const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		// Only allow numbers 1-5 or empty
		if (value === '' || /^[1-5]$/.test(value)) {
			setGradeValue(value)
		}
	}

	const handleClear = () => {
		if (inputType === 'grade') {
			setGradeValue('')
		} else {
			setStatusValue('')
		}
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
			<DialogTitle>
				Enter Grade
				<Typography variant='subtitle2' color='textSecondary'>
					{studentName} - {lessonDate}
				</Typography>
			</DialogTitle>
			<DialogContent>
				<FormControl component='fieldset' margin='normal'>
					<FormLabel component='legend'>Entry Type</FormLabel>
					<RadioGroup
						row
						value={inputType}
						onChange={e => setInputType(e.target.value as 'grade' | 'status')}
					>
						<FormControlLabel value='grade' control={<Radio />} label='Grade' />
						<FormControlLabel value='status' control={<Radio />} label='Status' />
					</RadioGroup>
				</FormControl>

				{inputType === 'grade' ? (
					<TextField
						autoFocus
						margin='dense'
						label='Grade (1-5)'
						type='number'
						fullWidth
						variant='outlined'
						value={gradeValue}
						onChange={handleGradeChange}
						inputProps={{ min: 1, max: 5 }}
					/>
				) : (
					<FormControl component='fieldset' margin='normal' fullWidth>
						<FormLabel component='legend'>Status</FormLabel>
						<RadioGroup value={statusValue} onChange={e => setStatusValue(e.target.value)}>
							<FormControlLabel value='A' control={<Radio />} label='Absent (A)' />
							<FormControlLabel value='E' control={<Radio />} label='Excused (E)' />
							<FormControlLabel value='L' control={<Radio />} label='Late (L)' />
							<FormControlLabel value='I' control={<Radio />} label='Incomplete (I)' />
						</RadioGroup>
					</FormControl>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClear} color='secondary'>
					Clear
				</Button>
				<Button onClick={onClose} color='primary'>
					Cancel
				</Button>
				<Button onClick={handleSave} color='primary' variant='contained'>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default GradeDialog
