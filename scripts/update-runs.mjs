// 走行距離の更新を1発で行う
//
//   npm run update-runs
//
// 1. health-data/ の一番新しい samsungcloud_*_access.zip（またはそれを展開したフォルダ）を探す
// 2. zip ならパスワードを聞いて Exercise/Exercise.csv だけを取り出す（7z を使用）
// 3. scripts/import-runs.mjs で src/data/runs.json を更新する
// 4. runs.json だけをコミットして push する

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'health-data');
const runsFile = 'src/data/runs.json';
const EXERCISE_CSV = 'Exercise/Exercise.csv';

const run = (cmd, args, opts = {}) =>
	execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts });

try {
	// 健康データが git に入らない設定になっているか、念のため確認
	try {
		run('git', ['check-ignore', '-q', 'health-data/check']);
	} catch {
		throw new Error('health-data/ が .gitignore で除外されていません。中止します');
	}

	// 1. 一番新しい書き出しを探す（名前の日付順）
	const names = existsSync(dataDir) ? readdirSync(dataDir) : [];
	const exports = [...new Set(names.map((f) => /^(samsungcloud_.*_access)(\.zip)?$/.exec(f)?.[1]).filter(Boolean))].sort(
		(a, b) => exportDate(a).localeCompare(exportDate(b)),
	);
	if (exports.length === 0) {
		throw new Error('health-data/ に samsungcloud_*_access.zip がありません');
	}
	const name = exports.at(-1);
	const folder = join(dataDir, name);
	const csv = join(folder, EXERCISE_CSV);
	console.log(`使う書き出し: health-data/${name}`);

	// 2. まだ取り出していなければ、zip から Exercise.csv だけを取り出す
	if (!existsSync(csv)) {
		const zip = `${folder}.zip`;
		if (!existsSync(zip)) throw new Error(`${zip} がありません`);
		try {
			execFileSync('7z', ['x', zip, EXERCISE_CSV, `-o${folder}`, '-y'], { cwd: root, stdio: 'inherit' });
		} catch (err) {
			if (err.code === 'ENOENT') throw new Error('7z が見つかりません。brew install p7zip でインストールしてください');
			throw new Error('zip を展開できませんでした（パスワードが違う可能性があります）');
		}
		if (!existsSync(csv)) throw new Error(`zip の中に ${EXERCISE_CSV} が見つかりませんでした`);
		console.log(`取り出しました: health-data/${name}/${EXERCISE_CSV}`);
	}

	// 3. 集計
	execFileSync(process.execPath, [join(root, 'scripts/import-runs.mjs'), csv], { cwd: root, stdio: 'inherit' });

	// 4. コミットと push（runs.json だけ）
	const changed = run('git', ['status', '--porcelain', '--', runsFile]).trim();
	if (!changed) {
		console.log('走行距離に変更はありませんでした。コミットせずに終了します');
		process.exit(0);
	}
	const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
	run('git', ['add', '--', runsFile]);
	run('git', ['commit', '-m', `Update running data (${today})`, '--', runsFile]);
	console.log('コミットしました');
	run('git', ['push'], { stdio: 'inherit' });
	console.log('push しました。数分後にサイトに反映されます');
} catch (err) {
	console.error(`\n失敗しました: ${err instanceof Error ? err.message : err}`);
	process.exit(1);
}

/** "samsungcloud_xxx_20261113_access" → "20261113" */
function exportDate(name) {
	return /_(\d{8})_access$/.exec(name)?.[1] ?? '';
}
