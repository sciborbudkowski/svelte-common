import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Build real consumer entries through package exports, with the same compiler as apps.
const workspace = await mkdtemp(resolve('.svelte-kit/bundle-consumers-'));
const heavyDependencies =
	/node_modules\/(gsap|date-fns|marked|isomorphic-dompurify|dompurify|jsdom)\//;
const unrelatedLibraryParts =
	/\/dist\/(?:services\/|stores\/|ui\/(?:Carousel|Dialog|Modal|ToastStack|Loader)(?:\.|\/)|ui\/internal\/)/;
const cases = [
	{
		name: 'Avatar subpath',
		code: "import Avatar from 'svelte-common/components/Avatar'; import { mount } from 'svelte'; mount(Avatar, { target: document.body, props: { initials: 'SC' } });",
		expectSvelte: true
	},
	{
		name: 'Avatar root import',
		code: "import { Avatar } from 'svelte-common'; import { mount } from 'svelte'; mount(Avatar, { target: document.body, props: { initials: 'SC' } });",
		expectSvelte: true
	},
	{
		name: 'File-size utility subpath',
		code: "import { friendlyFileSize } from 'svelte-common/utils/file-size'; console.log(friendlyFileSize(1024));",
		expectSvelte: false
	},
	{
		name: 'API service subpath',
		code: "import { ApiClient } from 'svelte-common/services/api'; console.log(new ApiClient({ baseUrl: '/api' }));",
		expectSvelte: false,
		allowServices: true
	},
	{
		name: 'Tokens and buttons CSS',
		code: "import 'svelte-common/tokens.css'; import 'svelte-common/styles/buttons.css'; console.log('styles loaded');",
		expectSvelte: false,
		allowCss: true
	}
];

try {
	for (const [index, sample] of cases.entries()) {
		const entry = join(workspace, `entry-${index}.js`);
		await writeFile(entry, sample.code);
		const result = await build({
			configFile: false,
			logLevel: 'error',
			plugins: [svelte({ configFile: false, compilerOptions: { runes: true } })],
			build: { write: false, minify: true, rollupOptions: { input: entry } }
		});
		const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) => output.output);
		const chunks = outputs.filter((output) => output.type === 'chunk');
		const modules = chunks.flatMap((chunk) =>
			Object.entries(chunk.modules)
				.filter(([, module]) => module.renderedLength > 0)
				.map(([id]) => id.replaceAll('\\', '/'))
		);
		assert(modules.length > 0, `${sample.name}: no rendered modules to inspect`);
		assert(
			!modules.some((id) => heavyDependencies.test(id)),
			`${sample.name}: unrelated heavy dependency included`
		);
		if (!sample.allowServices)
			assert(
				!modules.some((id) => unrelatedLibraryParts.test(id)),
				`${sample.name}: unrelated library feature included`
			);
		if (!sample.expectSvelte)
			assert(
				!modules.some((id) => /node_modules\/svelte\//.test(id)),
				`${sample.name}: Svelte runtime included`
			);
		const stylesheets = outputs.filter(
			(output) => output.type === 'asset' && output.fileName.endsWith('.css')
		);
		const css = stylesheets.map((output) => String(output.source)).join('\n');
		assert(
			stylesheets.length === 0 || sample.expectSvelte || sample.allowCss,
			`${sample.name}: stylesheet included in a utility bundle`
		);
		assert(
			!/\.(?:toast-stack|modal-backdrop|modern-carousel|switch|grid-2x2)\b/.test(css),
			`${sample.name}: unrelated component/helper styles included`
		);
		if (sample.allowCss)
			assert(css.includes('button') && css.includes('--sc-color-brand'), 'Selected CSS missing');
		const bytes = chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0);
		const gzipBytes = chunks.reduce((sum, chunk) => sum + gzipSync(chunk.code).byteLength, 0);
		console.log(
			`${sample.name}: ${bytes} JS bytes (${gzipBytes} gzip), ${Buffer.byteLength(css)} CSS bytes; unrelated dependencies excluded.`
		);
	}
} finally {
	await rm(workspace, { recursive: true, force: true });
}
