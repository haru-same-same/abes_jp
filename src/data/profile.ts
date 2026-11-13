// トップページのカードに出す内容。[ ] の部分を書き換えてください。

export const profile = {
	role: 'データサイエンティスト',
	bio: 'ビジネスに効くデータ分析が好きです。',
	now: '[所属・いま取り組んでいること]',
	interests: ['データ分析', '資格取得', 'マラソン'],
};

// 走行距離は Samsung Health から取り込む（npm run import-runs → src/data/runs.json）
export const running = {
	nextRace: '[大会名]',
};

export const certifications = {
	acquired: ['[資格名]', '[資格名]', '[資格名]', '[資格名]'],
	// 挑戦中の資格。なければ null
	current: { name: '[資格名]', progress: 60 } as { name: string; progress: number } | null,
};
