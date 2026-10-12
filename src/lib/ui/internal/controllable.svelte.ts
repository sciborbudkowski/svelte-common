import { untrack } from 'svelte';
import { notify, type ChangeHandler } from '../contracts.ts';

type Options<T, Details> = {
	value: () => T | undefined;
	defaultValue: () => T;
	onChange?: ChangeHandler<T, Details>;
	equals?: (a: T, b: T) => boolean;
};

/** Undefined selects local ownership; the ownership mode stays fixed until unmount. */
export function createControllableState<T, Details>(options: Options<T, Details>) {
	const controlled = untrack(() => options.value() !== undefined);
	let internal = $state.raw<T>(untrack(options.defaultValue));
	const equals = options.equals ?? Object.is;
	function read(): T {
		const supplied = options.value();
		if ((supplied !== undefined) !== controlled)
			throw new Error('State ownership cannot change without remounting.');
		return controlled ? (supplied as T) : internal;
	}
	return {
		controlled,
		get value(): T {
			return read();
		},
		request(next: T, details: Details): void {
			if (equals(read(), next)) return;
			if (!controlled) internal = next;
			untrack(() => notify(options.onChange, next, details));
		},
		/** Silent initialization/normalization/persistence updates to locally owned state. */
		replace(next: T): void {
			if (!controlled) internal = next;
		}
	};
}
