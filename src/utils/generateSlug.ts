/**
 * Generates a clean slug from a given string.
 * Only keeps lowercase letters, numbers, and dashes.
 * Removes emojis and special characters.
 */
export async function generateSlug(title: string): Promise<string> {
	return title
		.toLowerCase()
		.normalize('NFKD') // handles accented characters
		.replace(/[^a-z0-9\s-]/g, '') // remove everything except letters, numbers, spaces, dashes
		.replace(/\s+/g, '-') // convert spaces to dashes
		.replace(/-+/g, '-') // remove duplicate dashes
		.replace(/^-+|-+$/g, '') // trim starting/ending dashes
}
