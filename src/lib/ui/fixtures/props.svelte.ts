/** Reactive parent-owned props for mounted contract tests. */
export function createProps<T extends Record<string, unknown>>(initial: T): T {
	const props = $state(initial);
	return props;
}
