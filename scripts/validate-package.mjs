import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';

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
	const tarball = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	const result = await publint({ pack: { tarball } });
	for (const message of result.messages) console.log(formatMessage(message, result.pkg));
	if (result.messages.some((message) => message.type === 'error')) process.exitCode = 1;
	else console.log(`Packed archive validated: ${archives[0]}`);
} finally {
	await rm(destination, { recursive: true, force: true });
}
