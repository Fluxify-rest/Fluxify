export function extractFrontmatter(content: string): Record<string, any> {
	if (!content) return {};
	const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*/;
	const match = content.match(frontmatterRegex);

	if (!match || !match[1]) return {};

	const frontmatterBlock = match[1];
	const result: Record<string, any> = {};
	const lines = frontmatterBlock.split(/\r?\n/);

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Skip empty lines or comments
		if (!trimmedLine || trimmedLine.startsWith("#")) continue;

		const colonIndex = trimmedLine.indexOf(":");
		if (colonIndex === -1) continue;

		const key = trimmedLine.slice(0, colonIndex).trim();
		let value: any = trimmedLine.slice(colonIndex + 1).trim();

		// Clean up wrapped quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		// Basic type casting
		else if (value === "true") value = true;
		else if (value === "false") value = false;
		else if (value !== "" && !isNaN(Number(value))) value = Number(value);

		result[key] = value;
	}

	return result;
}
