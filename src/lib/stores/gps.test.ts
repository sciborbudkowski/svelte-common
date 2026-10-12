/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/stores/gps.test.ts

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('esm-env', async (importOriginal) => {
	const actual = await importOriginal<typeof import('esm-env')>();

	return {
		...actual,
		BROWSER: true
	};
});

import { Gps } from './gps.svelte.js';
import { BROWSER } from 'esm-env';

describe('Gps', () => {
	let watchPosition: Mock<Geolocation['watchPosition']>;
	let clearWatch: Mock<Geolocation['clearWatch']>;

	beforeEach(() => {
		let nextWatchId = 1;

		watchPosition = vi.fn<Geolocation['watchPosition']>(
			(
				_success: PositionCallback,
				_error?: PositionErrorCallback | null,
				_options?: PositionOptions
			): number => nextWatchId++
		);

		clearWatch = vi.fn<Geolocation['clearWatch']>((_watchId: number): void => {});

		const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>(
			(
				_success: PositionCallback,
				_error?: PositionErrorCallback | null,
				_options?: PositionOptions
			): void => {}
		);

		const geolocation: Geolocation = {
			getCurrentPosition,
			watchPosition,
			clearWatch
		};

		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: geolocation
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('obsługuje dwóch konsumentów o różnych trybach GPS', () => {
		const gps = new Gps();

		const cleanupBalanced = gps.init('balanced');

		expect(gps.state.active).toBe(true);
		expect(gps.state.mode).toBe('balanced');

		expect(watchPosition).toHaveBeenCalledTimes(1);

		expect(watchPosition).toHaveBeenNthCalledWith(1, expect.any(Function), expect.any(Function), {
			enableHighAccuracy: false,
			timeout: 20_000,
			maximumAge: 30_000
		});

		// Drugi konsument żąda dokładnego GPS.
		const cleanupPrecise = gps.init('precise');

		expect(gps.state.active).toBe(true);
		expect(gps.state.mode).toBe('precise');

		// balanced został zatrzymany i wystartował precise
		expect(clearWatch).toHaveBeenCalledWith(1);
		expect(watchPosition).toHaveBeenCalledTimes(2);

		expect(watchPosition).toHaveBeenNthCalledWith(2, expect.any(Function), expect.any(Function), {
			enableHighAccuracy: true,
			timeout: 30_000,
			maximumAge: 5000
		});

		// Konsument precise znika.
		// Nadal istnieje balanced, więc GPS nie może się wyłączyć.
		cleanupPrecise();

		expect(gps.state.active).toBe(true);
		expect(gps.state.mode).toBe('balanced');

		expect(clearWatch).toHaveBeenCalledWith(2);
		expect(watchPosition).toHaveBeenCalledTimes(3);

		// Ostatni konsument znika.
		cleanupBalanced();

		expect(gps.state.active).toBe(false);

		expect(clearWatch).toHaveBeenCalledWith(3);
		expect(clearWatch).toHaveBeenCalledTimes(3);
	});

	it('cleanup jednej subskrypcji jest idempotentny', () => {
		const gps = new Gps();

		const cleanupA = gps.init('balanced');
		const cleanupB = gps.init('balanced');

		expect(gps.state.active).toBe(true);

		// Dwóch balanced używa jednego watchPosition.
		expect(watchPosition).toHaveBeenCalledTimes(1);

		// Usuwamy A.
		cleanupA();

		// B nadal istnieje.
		expect(gps.state.active).toBe(true);
		expect(clearWatch).not.toHaveBeenCalled();

		// Przypadkowe powtórne wywołanie cleanup A.
		cleanupA();

		// Nadal nie wolno wyłączyć GPS,
		// bo B wciąż go używa.
		expect(gps.state.active).toBe(true);
		expect(clearWatch).not.toHaveBeenCalled();

		// Dopiero ostatni konsument wyłącza GPS.
		cleanupB();

		expect(gps.state.active).toBe(false);

		expect(clearWatch).toHaveBeenCalledTimes(1);
		expect(clearWatch).toHaveBeenCalledWith(1);
	});
	it('keeps watching after a transient timeout and recovers on a later position', () => {
		const gps = new Gps();
		const cleanup = gps.init();
		const error = watchPosition.mock.calls[0][1]!;
		error({
			code: 3,
			TIMEOUT: 3,
			POSITION_UNAVAILABLE: 2,
			PERMISSION_DENIED: 1,
			message: 'timeout'
		});
		expect(gps.state.active).toBe(true);
		expect(clearWatch).not.toHaveBeenCalled();
		watchPosition.mock.calls[0][0]({
			coords: {
				latitude: 10,
				longitude: 20,
				accuracy: 1,
				speed: null,
				heading: null,
				altitude: null,
				altitudeAccuracy: null
			},
			timestamp: 0
		} as GeolocationPosition);
		expect(gps.state.coords?.lat).toBe(10);
		expect(gps.state.error).toBeNull();
		cleanup();
	});
	it('ignores success and failure callbacks from a replaced watch', () => {
		const gps = new Gps();
		const balanced = gps.init();
		const old = watchPosition.mock.calls[0];
		const precise = gps.init('precise');
		old[0]({
			coords: { latitude: 99, longitude: 99, accuracy: 1 },
			timestamp: 0
		} as GeolocationPosition);
		old[1]!({
			code: 3,
			TIMEOUT: 3,
			POSITION_UNAVAILABLE: 2,
			PERMISSION_DENIED: 1,
			message: 'late timeout'
		});
		expect(gps.state.active).toBe(true);
		expect(gps.state.coords).toBeNull();
		expect(clearWatch).not.toHaveBeenCalledWith(2);
		precise();
		balanced();
	});
	it('stops on denied permission and supports an explicit restart for current consumers', () => {
		const gps = new Gps();
		const cleanup = gps.init();
		watchPosition.mock.calls[0][1]!({
			code: 1,
			TIMEOUT: 3,
			POSITION_UNAVAILABLE: 2,
			PERMISSION_DENIED: 1,
			message: 'denied'
		});
		expect(gps.state.active).toBe(false);
		gps.restart();
		expect(gps.state.active).toBe(true);
		expect(watchPosition).toHaveBeenCalledTimes(2);
		cleanup();
	});
});
