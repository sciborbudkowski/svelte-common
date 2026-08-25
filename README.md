# svelte-common library

## Installing

npm install git+ssh://git@github.com/sciborbudkowski/svelte-common.git

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
