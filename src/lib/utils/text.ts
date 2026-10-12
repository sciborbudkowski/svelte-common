// src/lib/utils/text.ts
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export const textToHtml = (text: string | null | undefined): string => {
	if (!text) return '';

	return DOMPurify.sanitize(marked.parseInline(text, { breaks: true }) as string);
};

export { friendlyFileSize } from './file-size.ts';
