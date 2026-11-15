// Samsung Health の書き出しデータから、月ごとのランニング距離を集計する
//
//   npm run import-runs -- <展開したフォルダ or Exercise.csv>
//
// 結果は src/data/runs.json に「月ごとの合計距離」だけを書き出す。
// 心拍数や位置情報を含む元の CSV はリポジトリに入れないこと。
//
// 対応している形式: Samsung アカウントの個人情報ダウンロード
// （samsungcloud_*_access.zip の中の Exercise/Exercise.csv）
//   - 1行目が列名（exercise_type, start_time, distance, time_offset など）
//   - start_time は走った地域の時刻（"YYYY-MM-DD HH:mm"）
//   - distance はメートル
//   - 位置情報などで数百 MB になるので、1行ずつ読む

import { createReadStream, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

// Samsung Health の運動の種類コード。1002 = ランニング
// （トレッドミルなど他の種類も数えたい場合はここに足す）
const RUN_TYPES = new Set(['1002']);
const OUT = new URL('../src/data/runs.json', import.meta.url);

const input = process.argv[2];
if (!input) {
	console.error('使い方: npm run import-runs -- <展開したフォルダ or Exercise.csv>');
	process.exit(1);
}

const csvPath = findExerciseCsv(input);
console.log(`読み込み: ${csvPath}`);

const months = {};
let header = null;
let total = 0;
let runs = 0;
for await (const record of readCsvRecords(csvPath)) {
	if (!header) {
		header = record;
		for (const name of ['exercise_type', 'start_time', 'distance']) {
			if (!header.includes(name)) throw new Error(`列 "${name}" が見つかりません。CSV の形式が想定と違う可能性があります`);
		}
		continue;
	}
	if (record.length === 1 && record[0] === '') continue;
	total++;
	const get = (name) => record[header.indexOf(name)] ?? '';
	if (!RUN_TYPES.has(get('exercise_type').trim())) continue;
	const meters = Number(get('distance'));
	if (!Number.isFinite(meters) || meters <= 0) continue;
	const month = /^(\d{4}-\d{2})-\d{2}/.exec(get('start_time').trim())?.[1];
	if (!month) continue;
	months[month] = (months[month] ?? 0) + meters;
	runs++;
}
if (!header) throw new Error(`${csvPath} が空です`);

const sorted = Object.fromEntries(
	Object.keys(months)
		.sort()
		.map((k) => [k, Math.round(months[k] / 100) / 10]),
);
// 「今月」の判定に使う日時。書き出し名の日付 → CSV の更新日時の順で使う
const exportedAt = exportDateFromPath(csvPath) ?? statSync(csvPath).mtime;
const data = { updatedAt: exportedAt.toISOString(), months: sorted };
writeFileSync(OUT, JSON.stringify(data, null, '\t') + '\n');

console.log(`ラン ${runs} 件を集計しました（全 ${total} 件中）`);
for (const [m, km] of Object.entries(sorted).slice(-6)) console.log(`  ${m}: ${km} km`);
console.log(`書き出し: src/data/runs.json`);

/** フォルダが渡されたら、その中（サブフォルダも含む）の Exercise.csv を探す */
function findExerciseCsv(path) {
	if (!statSync(path).isDirectory()) return path;
	const found = readdirSync(path, { recursive: true })
		.map(String)
		.filter((f) => /(^|[/\\])Exercise\.csv$/.test(f));
	if (found.length === 0) throw new Error(`${path} に Exercise/Exercise.csv が見つかりません`);
	if (found.length > 1) throw new Error(`${path} に Exercise.csv が複数あります: ${found.join(', ')}`);
	return join(path, found[0]);
}

/** "samsungcloud_xxx_20261113_access" → 日本時間の 2026-11-13 00:00 */
function exportDateFromPath(path) {
	const m = /_(\d{4})(\d{2})(\d{2})_access/.exec(path);
	if (!m) return null;
	const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`);
	return Number.isNaN(d.valueOf()) ? null : d;
}

/** 引用符・改行を含むフィールドに対応して、CSV を1レコードずつ返す */
async function* readCsvRecords(path) {
	const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
	let pending = null;
	let first = true;
	for await (let line of lines) {
		if (first) {
			line = line.replace(/^﻿/, '');
			first = false;
		}
		pending = pending === null ? line : `${pending}\n${line}`;
		// 引用符の数が奇数なら、フィールドの途中で改行している
		if ((pending.match(/"/g)?.length ?? 0) % 2 === 1) continue;
		yield parseCsvLine(pending);
		pending = null;
	}
	if (pending !== null) yield parseCsvLine(pending);
}

function parseCsvLine(text) {
	const row = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			} else if (c === '"') quoted = false;
			else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ',') {
			row.push(field);
			field = '';
		} else field += c;
	}
	row.push(field);
	return row;
}
