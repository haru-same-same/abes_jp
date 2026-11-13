// トップページのカードに出す内容。[ ] の部分を書き換えてください。

export const profile = {
	role: 'データサイエンティスト',
	bio: 'ビジネスに効くデータ分析が好きです。',
	now: 'とある受託分析企業で働いています。',
	interests: ['データ分析', '資格取得', 'マラソン'],
};

// 走行距離は Samsung Health から取り込む（npm run import-runs → src/data/runs.json）
export const running = {
	nextRace: '---',
};

export const certifications = {
	acquired: ['情報処理安全確保支援士 (未登録)', '宅地建物取引士', '応用情報処理技術者', '基本情報処理技術者'],
	// 挑戦中の資格。なければ null
	current: { name: '気象予報士', progress: 20 } as { name: string; progress: number } | null,
};
