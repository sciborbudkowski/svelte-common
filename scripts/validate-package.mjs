import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';
import { unpack } from '@publint/pack';

// Inspect a real archive without depending on npm printing its filename to stdout.
const destination = await mkdtemp(join(tmpdir(), 'svelte-common-pack-'));
try {
	const args = ['pack', '--ignore-scripts', '--pack-destination', destination, '--json'];
	const npmPath = process.env.npm_execpath;
	await promisify(execFile)(
		npmPath ? process.execPath : 'npm',
		npmPath ? [npmPath, ...args] : args,
		{ maxBuffer: 10 * 1024 * 1024 }
	);
	const archives = (await readdir(destination)).filter((name) => name.endsWith('.tgz'));
	if (archives.length !== 1)
		throw new Error(`Expected one package archive, found ${archives.length}.`);
	const bytes = await readFile(join(destination, archives[0]));
	// Check actual archive contents, including every explicit export and private drafts.
	const packed = await unpack(bytes);
	const packedPaths = new Set(
		packed.files.map(({ name }) => name.slice(packed.rootDir.length + 1))
	);
	const manifest = JSON.parse(await readFile('package.json', 'utf8'));
	for (const [name, target] of Object.entries(manifest.exports)) {
		for (const path of typeof target === 'string' ? [target] : Object.values(target)) {
			if (!packedPaths.has(path.replace(/^\.\//, '')))
				throw new Error(`Missing packed export ${name}: ${path}`);
		}
	}
	for (const path of packedPaths) {
		if (/CollapsibleTabBar|\.(test|spec)\.|\/fixtures\//.test(path))
			throw new Error(`Private development file shipped: ${path}`);
	}
	for (const path of ['LICENSE', 'THIRD_PARTY_NOTICES.md'])
		if (!packedPaths.has(path)) throw new Error(`Missing packed license/notice: ${path}`);
	const tarball = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	const result = await publint({ pack: { tarball } });
	for (const message of result.messages) console.log(formatMessage(message, result.pkg));
	if (result.messages.some((message) => message.type === 'error')) process.exitCode = 1;
	else console.log(`Packed archive validated: ${archives[0]}`);
} finally {
	await rm(destination, { recursive: true, force: true });
}
