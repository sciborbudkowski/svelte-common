import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const textToHtml = (text: string | null | undefined): string => {
    if(!text) return '';

    return DOMPurify.sanitize(marked.parseInline(text, { breaks: true }) as string);
}