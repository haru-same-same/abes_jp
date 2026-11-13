// Samsung Health の書き出しデータから、月ごとのランニング距離を集計する
//
//   npm run import-runs -- <書き出したフォルダ or exercise の CSV ファイル>
//
// 結果は src/data/runs.json に「月ごとの合計距離」だけを書き出す。
// 心拍数などを含む元の CSV はリポジトリに入れないこと。

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

// Samsung Health の運動の種類コード。1002 = ランニング
// （トレッドミルなど他の種類も数えたい場合はここに足す）
const RUN_TYPES = new Set([1002]);
const OUT = new URL('../src/data/runs.json', import.meta.url);

const input = process.argv[2];
if (!input) {
	console.error('使い方: npm run import-runs -- <Samsung Health の書き出しフォルダ or exercise の CSV>');
	process.exit(1);
}

const csvPath = findExerciseCsv(input);
console.log(`読み込み: ${csvPath}`);
const rows = parseSamsungCsv(readFileSync(csvPath, 'utf8'));

const col = (name) => {
	const key = Object.keys(rows[0] ?? {}).find((k) => k === name || k.endsWith(`.${name}`));
	if (!key) throw new Error(`列 "${name}" が見つかりません。CSV の形式が想定と違う可能性があります`);
	return key;
};
const typeKey = col('exercise_type');
const distKey = col('distance');
const startKey = col('start_time');
const offsetKey = Object.keys(rows[0] ?? {}).find((k) => k.endsWith('time_offset'));

const months = {};
let runs = 0;
for (const row of rows) {
	if (!RUN_TYPES.has(Number(row[typeKey]))) continue;
	const meters = Number(row[distKey]);
	if (!Number.isFinite(meters) || meters <= 0) continue;
	const month = localMonth(row[startKey], offsetKey ? row[offsetKey] : '');
	if (!month) continue;
	months[month] = (months[month] ?? 0) + meters;
	runs++;
}

const sorted = Object.fromEntries(
	Object.keys(months)
		.sort()
		.map((k) => [k, Math.round(months[k] / 100) / 10]),
);
// 「今月」の判定に使う日時。書き出しファイル名の日時（日本時間）を優先する
const exportedAt = exportTimeFromName(basename(csvPath)) ?? new Date();
const data = { updatedAt: exportedAt.toISOString(), months: sorted };
writeFileSync(OUT, JSON.stringify(data, null, '\t') + '\n');

console.log(`ラン ${runs} 件を集計しました（全 ${rows.length} 件中）`);
for (const [m, km] of Object.entries(sorted).slice(-6)) console.log(`  ${m}: ${km} km`);
console.log(`書き出し: src/data/runs.json`);

/** フォルダが渡されたら、その中（サブフォルダも含む）の exercise の CSV を探す */
function findExerciseCsv(path) {
	if (!statSync(path).isDirectory()) return path;
	const pattern = /^com\.samsung\.shealth\.exercise\.\d+\.csv$/;
	const found = readdirSync(path, { recursive: true })
		.map(String)
		.filter((f) => pattern.test(basename(f)));
	if (found.length === 0) {
		throw new Error(`${path} に com.samsung.shealth.exercise.*.csv が見つかりません`);
	}
	// 複数あればファイル名の日時が一番新しいもの
	found.sort((a, b) => basename(a).localeCompare(basename(b)));
	return join(path, found.at(-1));
}

/** "com.samsung.shealth.exercise.20261113160000.csv" → 日本時間の 2026-11-13 16:00:00 */
function exportTimeFromName(name) {
	const m = /\.(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.csv$/.exec(name);
	if (!m) return null;
	const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`);
	return Number.isNaN(d.valueOf()) ? null : d;
}

/**
 * Samsung Health の CSV を読む。
 * 1行目はデータ種別などのメタ情報、2行目が列名、3行目以降がデータ。
 */
function parseSamsungCsv(text) {
	const lines = parseCsv(text.replace(/^﻿/, ''));
	const headerIndex = lines.findIndex((l) => l.some((c) => c.endsWith('exercise_type')));
	if (headerIndex === -1) throw new Error(`${basename(csvPath)} に exercise_type 列がありません`);
	const header = lines[headerIndex];
	return lines
		.slice(headerIndex + 1)
		.filter((l) => l.some((c) => c !== ''))
		.map((l) => Object.fromEntries(header.map((h, i) => [h, l[i] ?? ''])));
}

/** 引用符と改行を含むフィールドに対応した最小限の CSV パーサー */
function parseCsv(text) {
	const out = [];
	let row = [];
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
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			out.push(row);
			row = [];
			field = '';
		} else field += c;
	}
	if (field !== '' || row.length) {
		row.push(field);
		out.push(row);
	}
	return out;
}

/**
 * start_time（UTC の "YYYY-MM-DD HH:mm:ss.SSS"）と time_offset（"UTC+0900"）から
 * 走った地域の時刻での "YYYY-MM" を返す。オフセットがなければ日本時間とみなす。
 */
function localMonth(start, offset) {
	const t = Date.parse(start.trim().replace(' ', 'T') + 'Z');
	if (Number.isNaN(t)) return null;
	const m = /([+-])(\d{2}):?(\d{2})/.exec(offset ?? '');
	const minutes = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 9 * 60;
	return new Date(t + minutes * 60000).toISOString().slice(0, 7);
}
