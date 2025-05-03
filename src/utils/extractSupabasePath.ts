/**
 * Extracts the internal file path (without bucket name) and keeps the file extension.
 * @param url Full public URL of the file
 * @returns Internal path (e.g., "photos/this is new title-1745574600795.jpg")
 */
export function extractSupabasePath(url: string): string | null {
	try {
		const urlPattern = /https:\/\/[^\/]+\/storage\/v1\/object\/public\/([^?]+)$/
		const matches = url.match(urlPattern)

		if (!matches || matches.length < 2) return null

		// The first captured group will contain the full path after the bucket name
		const path = decodeURIComponent(matches[1])

		return path
	} catch (err) {
		console.error('Failed to extract path:', err)
		return null
	}
}
