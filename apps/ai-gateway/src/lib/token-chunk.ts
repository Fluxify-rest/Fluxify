interface ChunkOptions {
	maxLengthInTokens: number;
	overlapTokens?: number;
}

/**
 * Splits a markdown string into chunks based on an approximate token size.
 * It attempts to split at logical boundaries (paragraphs or sentences) to preserve context.
 * * @param markdown The raw markdown content as a string.
 * @param options Configuration for max tokens and optional overlap.
 * @returns An array of string chunks.
 */
export function chunkMarkdown(
	markdown: string,
	options: ChunkOptions,
): string[] {
	const { maxLengthInTokens, overlapTokens = 0 } = options;

	// Rule of thumb: 1 token ≈ 4 characters
	const CHARS_PER_TOKEN = 4;
	const maxChunkLength = maxLengthInTokens * CHARS_PER_TOKEN;
	const overlapLength = overlapTokens * CHARS_PER_TOKEN;

	if (markdown.length <= maxChunkLength) {
		return [markdown];
	}

	const chunks: string[] = [];
	let currentIndex = 0;

	while (currentIndex < markdown.length) {
		// Determine the ideal end of the chunk
		let endIndex = currentIndex + maxChunkLength;

		if (endIndex >= markdown.length) {
			chunks.push(markdown.slice(currentIndex).trim());
			break;
		}

		// Look for a natural split point within the last 20% of the chunk to preserve readability
		const lookbackLimit = Math.floor(maxChunkLength * 0.2);
		const searchScope = markdown.slice(endIndex - lookbackLimit, endIndex);

		let splitOffset = -1;

		// 1. Try splitting at a paragraph break
		splitOffset = searchScope.lastIndexOf("\n\n");

		// 2. Try splitting at a line break
		if (splitOffset === -1) {
			splitOffset = searchScope.lastIndexOf("\n");
		}

		// 3. Try splitting at a sentence end (period, question mark, exclamation) followed by a space
		if (splitOffset === -1) {
			const sentenceEnd = searchScope.search(/[.!?]\s+(?=[^.!?]*$)/);
			if (sentenceEnd !== -1) {
				splitOffset = sentenceEnd + 1; // Split right after the punctuation
			}
		}

		// 4. Try splitting at a word boundary
		if (splitOffset === -1) {
			splitOffset = searchScope.lastIndexOf(" ");
		}

		// Adjust endIndex based on where we found a logical split
		if (splitOffset !== -1) {
			endIndex = endIndex - lookbackLimit + splitOffset;
		}

		// Extract the chunk
		const chunk = markdown.slice(currentIndex, endIndex).trim();
		if (chunk) {
			chunks.push(chunk);
		}

		// Move the index forward, accounting for overlap if specified
		currentIndex = endIndex - overlapLength;

		// Prevent infinite loops if overlap is poorly configured or no progress is made
		if (currentIndex <= endIndex - maxChunkLength) {
			currentIndex = endIndex;
		}
	}

	return chunks;
}
