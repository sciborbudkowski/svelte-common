import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api.ts';

class DownloadURL extends URL {
	static createObjectURL = vi.fn(() => 'blob:audit');
	static revokeObjectURL = vi.fn();
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal('URL', DownloadURL);
	vi.stubGlobal('navigator', { userActivation: { isActive: true } });
	vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	DownloadURL.createObjectURL.mockClear();
	DownloadURL.revokeObjectURL.mockClear();
	document.body.innerHTML = '';
});

describe('download saving', () => {
	it('opens the picker before fetch, then writes the downloaded blob to that handle', async () => {
		const writable = {
			write: vi.fn().mockResolvedValue(undefined),
			close: vi.fn().mockResolvedValue(undefined),
			abort: vi.fn()
		};
		const handle = { createWritable: vi.fn().mockResolvedValue(writable) };
		const picker = vi.fn().mockResolvedValue(handle);
		vi.stubGlobal('showSaveFilePicker', picker);
		const fetcher = vi.fn(() => {
			expect(picker).toHaveBeenCalled();
			return Promise.resolve(new Response('file'));
		});
		const result = await new ApiClient({ fetch: fetcher }).downloadAndSave(
			'/file',
			{},
			{ suggestedName: 'report.txt' }
		);
		expect(result.error).toBe(false);
		expect(picker).toHaveBeenCalledWith({ suggestedName: 'report.txt' });
		expect(writable.write).toHaveBeenCalledWith(expect.any(Blob));
		expect(writable.close).toHaveBeenCalled();
		expect(DownloadURL.createObjectURL).not.toHaveBeenCalled();
	});
	it('falls back to a link when a picker is blocked and revokes its URL after a grace period', async () => {
		vi.stubGlobal(
			'showSaveFilePicker',
			vi.fn().mockRejectedValue(new DOMException('blocked', 'SecurityError'))
		);
		expect(
			(
				await new ApiClient({
					fetch: vi.fn().mockResolvedValue(new Response('file'))
				}).downloadAndSave('/file')
			).error
		).toBe(false);
		expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
		expect(document.querySelector('a')).toBeNull();
		expect(DownloadURL.revokeObjectURL).not.toHaveBeenCalled();
		vi.advanceTimersByTime(30_000);
		expect(DownloadURL.revokeObjectURL).toHaveBeenCalledWith('blob:audit');
	});
	it('preserves picker cancellation without fetching or starting another save flow', async () => {
		vi.stubGlobal(
			'showSaveFilePicker',
			vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'))
		);
		const fetcher = vi.fn();
		expect(await new ApiClient({ fetch: fetcher }).downloadAndSave('/file')).toEqual({
			error: false,
			cancelled: true
		});
		expect(fetcher).not.toHaveBeenCalled();
		expect(DownloadURL.createObjectURL).not.toHaveBeenCalled();
	});
	it('uses the link fallback when a slow response outlives share activation', async () => {
		vi.stubGlobal('showSaveFilePicker', undefined);
		const activation = { isActive: true };
		const share = vi.fn();
		vi.stubGlobal('navigator', { userActivation: activation, canShare: () => true, share });
		const fetcher = vi.fn(() => {
			activation.isActive = false;
			return Promise.resolve(new Response('file'));
		});
		expect((await new ApiClient({ fetch: fetcher }).downloadAndSave('/file')).error).toBe(false);
		expect(share).not.toHaveBeenCalled();
		expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
	});
	it('falls back from a blocked share, but preserves a user-cancelled share', async () => {
		vi.stubGlobal('showSaveFilePicker', undefined);
		const share = vi
			.fn()
			.mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'))
			.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'));
		vi.stubGlobal('navigator', { userActivation: { isActive: true }, canShare: () => true, share });
		const client = new ApiClient({
			fetch: vi.fn().mockImplementation(() => Promise.resolve(new Response('file')))
		});
		expect((await client.downloadAndSave('/file')).error).toBe(false);
		expect(await client.downloadAndSave('/file')).toMatchObject({ error: false, cancelled: true });
		expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
	});
});
