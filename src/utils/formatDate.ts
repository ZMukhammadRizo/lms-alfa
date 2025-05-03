// utils/formatDate.js

export function formatDateToLocal(inputDate: string | any) {
	const date = new Date(inputDate)

	const day = String(date.getDate()).padStart(2, '0')
	const month = String(date.getMonth() + 1).padStart(2, '0') // Months are 0-based
	const year = date.getFullYear()
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	return `${day}/${month}/${year} ${hours}:${minutes}`
}
