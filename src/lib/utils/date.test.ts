import { describe, expect, it } from 'vitest';
import {
	formatDate,
	toYMDHMDate,
	toHMSTime,
	getDistanceToNow,
	formatDateDifference,
	getTimeDifference
} from './date.ts';

describe('date inputs', () => {
	it('accepts epoch zero consistently with a Date object', () => {
		for (const format of [formatDate, toYMDHMDate, toHMSTime, getDistanceToNow]) {
			expect(format(0)).toBe(format(new Date(0)));
			expect(format(0)).toBeTruthy();
		}
		expect(formatDateDifference(0, 60_000)).toBeTruthy();
		expect(getTimeDifference(0, 60_000)).toBe('00:01:00');
	});
	it('preserves the missing and invalid date behavior', () => {
		expect(formatDate(null)).toBeNull();
		expect(formatDate('')).toBeNull();
		expect(toHMSTime('invalid')).toBe('');
		expect(formatDateDifference('', 0)).toBe('');
	});
});
