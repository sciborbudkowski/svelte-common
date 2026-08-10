// src/lib/stores/gps.svelte.ts

import { browser } from '$app/env';

export type GpsPosition = {
	lat: number;
	lon: number;
	speed?: number | null;
	heading?: number | null;
	altitude?: number | null;
};

export type GpsCoords = GpsPosition & { zoom?: number };
export type GpsMode = 'balanced' | 'precise';

export interface GpsState {
	supported: boolean;
	active: boolean;
	mode: GpsMode;
	coords: GpsCoords | null;
	accuracy: number | null;
	error: string | null;
	updatedAt: number | null;
	intervalMs: number;
}

export interface GpsOptions {
	enableHighAccuracy: boolean;
	maximumAge?: number;
	timeout?: number;
}

const GPS_INTERVAL_MS = 10_000;

export class Gps {
	state = $state<GpsState>({
		supported: browser && 'geolocation' in navigator,
		active: false,
		mode: 'balanced',
		coords: null,
		accuracy: null,
		error: null,
		updatedAt: null,
		intervalMs: GPS_INTERVAL_MS
	});

	private watchId: number | null = null;
	private balancedConsumers = 0;
	private preciseConsumers = 0;
	private lastEmitedAt = 0;

	private getEffectiveMode(): GpsMode {
		return this.preciseConsumers > 0 ? 'precise' : 'balanced';
	}

	getErrorDescriptionFor(err: GeolocationPositionError): string {
		switch (err.code) {
			case err.PERMISSION_DENIED:
				return 'Dostęp do GPS został zablokowany.';
			case err.POSITION_UNAVAILABLE:
				return 'Nie można określić pozycji odbiornika GPS.';
			case err.TIMEOUT:
				return 'Przekroczony czas oczekiwania na pozycję GPS.';
			default:
				return 'Błąd odczytu pozycji odbiornika GPS.';
		}
	}

	getGpsOptions(mode: GpsMode): GpsOptions {
		return {
			enableHighAccuracy: mode === 'precise' ? true : false,
			timeout: mode === 'precise' ? 30_000 : 20_000,
			maximumAge: mode === 'precise' ? 5000 : 30_000
		};
	}

	stop(): void {
		if (this.watchId !== null && browser && 'geolocation' in navigator)
			navigator.geolocation.clearWatch(this.watchId);

		this.watchId = null;
		this.state.active = false;
	}

	start(): void {
		if (!browser || !('geolocation' in navigator)) {
			this.state.supported = false;
			this.state.error = 'Brak obsługi GPS na tym urządzeniu.';
			return;
		}

		if (this.watchId) return;

		this.state.supported = true;
		this.state.mode = this.getEffectiveMode();
		this.state.error = null;

		this.watchId = navigator.geolocation.watchPosition(
			(pos) => {
				const now = Date.now();
				const shouldEmit =
					this.state.updatedAt === null || now - this.lastEmitedAt >= this.state.intervalMs;
				if (!shouldEmit) return;

				this.state.coords = {
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
					speed: pos.coords.speed,
					altitude: pos.coords.altitude,
					heading: pos.coords.heading
				};

				this.state.accuracy = pos.coords.accuracy;
				this.state.error = null;
				this.state.updatedAt = now;
				this.lastEmitedAt = now;
			},
			(err) => {
				this.state.error = `${err.code}: ${err.message}`;
			},
			this.getGpsOptions(this.state.mode)
		);

		this.state.active = true;
	}

	restart(): void {
		if (this.watchId === null) return;

		const nextMode = this.getEffectiveMode();
		if (nextMode === this.state.mode) return;

		this.stop();
		this.start();
	}

	setInterval(ms: number): void {
		this.state.intervalMs = Math.max(1000, Math.floor(ms));
	}

	init(mode: GpsMode = 'balanced'): () => void {
		if (mode === 'precise') {
			this.preciseConsumers++;
		} else {
			this.balancedConsumers++;
		}

		this.start();
		this.restart();

		return () => {
			if (mode === 'precise') {
				this.preciseConsumers = Math.max(0, this.preciseConsumers - 1);
			} else {
				this.balancedConsumers = Math.max(0, this.balancedConsumers - 1);
			}

			const total = this.balancedConsumers + this.preciseConsumers;
			if (total === 0) {
				this.stop();
				return;
			}

			this.restart();
		};
	}
}
