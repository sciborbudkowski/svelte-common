// src/lib/stores/loader.svelte.ts
interface LoaderState {
	isVisible: boolean;
	message: string;
	progress: number;
	status: string;
}

export interface LoaderStep {
	progress: number;
	status: string | (() => string);
	callback?: () => MaybePromise<void>;
}

type MaybePromise<T> = T | Promise<T>;

export const loaderState: LoaderState = $state({
	isVisible: false,
	message: 'Ładowanie...',
	progress: 0,
	status: 'Proszę czekać.'
});

let currentRunId = 0;

export const showLoader = (m: string = 'Ładowanie...') => {
	const runId = ++currentRunId;

	loaderState.isVisible = true;
	loaderState.message = m;
	loaderState.progress = 0;
	loaderState.status = 'Proszę czekać.';

	return runId;
};

export const hideLoader = () => {
	currentRunId += 1;
	loaderState.isVisible = false;
};

export const updateLoaderProgress = (percentage: number, status: string = 'Proszę czekać.'): void => {
	loaderState.progress = percentage;
	loaderState.status = status;
};

export const updateLoaderMessage = (m: string) => (loaderState.message = m);

export const showLoaderSequence = async (
	steps: LoaderStep[] = [],
	options?: {
		message?: string;
		hideOnFinish?: boolean;
	}
) => {
	const runId = showLoader(options?.message);

	try {
		for (const step of steps) {
			if (runId !== currentRunId) return;

			const status = typeof step.status === 'function' ? step.status() : step.status;
			updateLoaderProgress(step.progress, status);
			if (step.callback) await step.callback();

			// Pozwala Svelte zamontować kolejny widok, który może przejąć loader.
			await Promise.resolve();
		}
	} finally {
		if (runId === currentRunId && (options?.hideOnFinish ?? true)) {
			hideLoader();
		}
	}
};
