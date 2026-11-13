// 走行距離の更新を1発で行う
//
//   npm run update-runs
//
// 1. health-data/ の一番新しい書き出し（フォルダ or zip）を探す
// 2. scripts/import-runs.mjs で src/data/runs.json を更新する
// 3. runs.json だけをコミットして push する

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'health-data');
const runsFile = 'src/data/runs.json';

const run = (cmd, args, opts = {}) =>
	execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts });

try {
	// 健康データが git に入らない設定になっているか、念のため確認
	try {
		run('git', ['check-ignore', '-q', 'health-data/check']);
	} catch {
		throw new Error('health-data/ が .gitignore で除外されていません。中止します');
	}

	// 1. 一番新しい書き出しを探す
	const entries = existsSync(dataDir)
		? readdirSync(dataDir)
				.filter((f) => f !== 'README.md' && !f.startsWith('.'))
				.map((f) => ({ name: f, path: join(dataDir, f), mtime: statSync(join(dataDir, f)).mtimeMs }))
				.filter((e) => statSync(e.path).isDirectory() || e.name.endsWith('.zip'))
				.sort((a, b) => b.mtime - a.mtime)
		: [];
	if (entries.length === 0) {
		throw new Error('health-data/ に Samsung Health の書き出し（フォルダ or zip）がありません');
	}
	let source = entries[0];
	console.log(`使う書き出し: health-data/${source.name}`);

	// zip なら同じ名前のフォルダに展開する
	if (source.name.endsWith('.zip')) {
		const dest = source.path.replace(/\.zip$/, '');
		run('unzip', ['-o', '-q', source.path, '-d', dest]);
		source = { ...source, path: dest };
		console.log(`展開しました: health-data/${basename(dest)}`);
	}

	// 2. 集計
	execFileSync(process.execPath, [join(root, 'scripts/import-runs.mjs'), source.path], { cwd: root, stdio: 'inherit' });

	// 3. コミットと push（runs.json だけ）
	const changed = run('git', ['status', '--porcelain', '--', runsFile]).trim();
	if (!changed) {
		console.log('走行距離に変更はありませんでした。コミットせずに終了します');
		process.exit(0);
	}
	const month = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
	run('git', ['add', '--', runsFile]);
	run('git', ['commit', '-m', `Update running data (${month})`, '--', runsFile]);
	console.log('コミットしました');
	run('git', ['push'], { stdio: 'inherit' });
	console.log('push しました。数分後にサイトに反映されます');
} catch (err) {
	console.error(`\n失敗しました: ${err instanceof Error ? err.message : err}`);
	process.exit(1);
}
