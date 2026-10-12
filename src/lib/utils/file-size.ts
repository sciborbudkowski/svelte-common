/** Format a byte count without importing the Markdown parser or sanitizer. */
export const friendlyFileSize = (bytes: number): string => {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let i = 0;
	while (bytes >= 1024 && i < units.length - 1) {
		bytes /= 1024;
		i++;
	}
	return `${bytes.toFixed(1)} ${units[i]}`;
};
