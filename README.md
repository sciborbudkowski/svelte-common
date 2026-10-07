# svelte-common library

## Installing

npm install git+ssh://git@github.com/sciborbudkowski/svelte-common.git

## Modal scroll locking

Configure the application's scroll container once in the root layout. This applies to
`Modal`, `AlertModal` and `ConfirmModal`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { setModalScrollLockTarget } from 'svelte-common';

	let mainElement = $state<HTMLElement | null>(null);

	onMount(() => {
		setModalScrollLockTarget(mainElement);
		return () => setModalScrollLockTarget(null);
	});
</script>

<main bind:this={mainElement}>
	<!-- Application content -->
</main>
```

Without configuration, the target defaults to `document.body`. The first open modal
saves the target's inline overflow values and priorities, then sets `overflow: hidden`.
The original values return after the last modal closes or unmounts, regardless of
closing order. Changing the target while modals are open restores the old target
and locks the new one. Only `.modal-body` scrolls inside the modal.

## Light and dark theme

Initialize theme synchronization once in the root layout:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeTheme } from 'svelte-common';

	onMount(initializeTheme);
</script>
```

To avoid a flash of the light theme, add this script to the `<head>` of the consuming
application's `app.html` (add a nonce or hash when using a restrictive CSP):

```html
<script>
	(() => {
		let preference = 'system';

		try {
			const stored = localStorage.getItem('sc-theme');
			if (stored === 'light' || stored === 'dark' || stored === 'system') preference = stored;
		} catch {
			// Storage is optional.
		}

		const systemDark =
			typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.dataset.theme =
			preference === 'dark' || (preference === 'system' && systemDark) ? 'dark' : 'light';
	})();
</script>
```

Use `setTheme('light' | 'dark' | 'system')`, `toggleTheme()` or `useSystemTheme()` to change
the preference. Reactive `themeState` exposes both the saved `preference` and currently
`resolved` theme.
