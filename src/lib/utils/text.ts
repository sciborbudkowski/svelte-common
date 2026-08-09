// src/lib/utils/text.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const textToHtml = (text: string | null | undefined): string => {
    if(!text) return '';

    return DOMPurify.sanitize(marked.parseInline(text, { breaks: true }) as string);
};

export const friendlyFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
}