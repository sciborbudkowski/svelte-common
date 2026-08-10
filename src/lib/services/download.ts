// src/lib/services/download.ts
import type { ApiResponse } from './api.ts';

export interface DownloadOptions {
	suggestedName?: string;
	fallbackBaseName?: string;
	credentials?: RequestCredentials;
}

const parseFilename = (cd: string | null): string | undefined => {
	if (!cd) return;

	const m =
		cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i) ?? cd.match(/filename\s*=\s*"?([^";]+)"?/i);

	if (!m) return;

	try {
		return decodeURIComponent(m[1]);
	} catch {
		return m[1];
	}
};

async function saveBlobToDevice(blob: Blob, filename: string): Promise<void> {
	// Android
	ConsiderSavePicker: {
		type WindowWithSavePicker = Window & {
			showSaveFilePicker?: (options?: {
				suggestedName?: string;
				types?: {
					description?: string;
					accept: Record<string, string[]>;
				}[];
			}) => Promise<FileSystemFileHandle>;
		};

		const picker = (window as WindowWithSavePicker).showSaveFilePicker;
		if (typeof picker !== 'function') break ConsiderSavePicker;

		const handle = await picker({ suggestedName: filename });

		const writable = await handle.createWritable();
		await writable.write(blob);
		await writable.close();
		return;
	}

	// iOS/Android
	ConsiderShare: {
		if (!navigator.canShare || !navigator.share) break ConsiderShare;
		const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
		if (!navigator.canShare({ files: [file] })) break ConsiderShare;
		await navigator.share({ files: [file], title: filename });
		return;
	}

	// Fallback
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

const guessExtFromMime = (mime: string): string => {
	const m = mime.toLowerCase().split(';')[0].trim();
	switch (m) {
		case 'application/pdf':
			return 'pdf';
		case 'image/png':
			return 'png';
		case 'image/jpeg':
			return 'jpg';
		case 'text/plain':
			return 'txt';
		case 'text/html':
			return 'html';
		case 'application/zip':
			return 'zip';
		case 'application/vnd.rar':
			return 'rar';
		case 'video/mp4':
			return 'mp4';
		case 'video/x-msvideo':
			return 'avi';
		case 'application/msword':
			return 'doc';
		case 'application/vnd.ms-excel':
			return 'xls';
		case 'application/vnd.ms-powerpoint':
			return 'ppt';
		case 'application/rtf':
			return 'rtf';
		default:
			return '';
	}
};

const ensureFilename = (name?: string, contentType?: string, fallbackBase = 'download'): string => {
	if (name && name.trim()) return name;

	const ext = contentType ? guessExtFromMime(contentType) : '';
	return ext ? `${fallbackBase}.${ext}` : fallbackBase;
};

export async function downloadAndSave(
	input: RequestInfo,
	init: RequestInit = {},
	options: DownloadOptions = {}
): Promise<ApiResponse> {
	if (typeof document === 'undefined')
		return { error: true, message: 'Download allowed only in browser.' };

	try {
		const res = await fetch(input, {
			credentials: options.credentials,
			...init,
			method: init.method ?? 'GET'
		});
		if (!res.ok) {
			const ct = res.headers.get('Content-Type') ?? '';
			let msg = 'Pobieranie nieudane';

			if (ct.includes('application/json')) {
				try {
					const body = await res.json();
					msg = body?.message ?? body?.error ?? msg;
				} catch {
					// ignore
				}
			}

			return { error: true, message: msg, status: res.status };
		}

		const contentType = res.headers.get('Content-Type') ?? undefined;
		const fromHeader = parseFilename(res.headers.get('Content-Disposition'));
		const filename = ensureFilename(
			fromHeader ?? options?.suggestedName,
			contentType,
			options?.fallbackBaseName ?? 'download'
		);

		const blob = await res.blob();
		await saveBlobToDevice(blob, filename);

		return { error: false, status: res.status };
	} catch (err: unknown) {
		return { error: true, message: `Network error: ${err}` };
	}
}
