// トップページのカードに出す内容。[ ] の部分を書き換えてください。

export const profile = {
	role: 'データサイエンティスト',
	bio: 'ビジネスに効くデータ分析が好きです。',
	now: '[所属・いま取り組んでいること]',
	interests: ['データ分析', '資格取得', 'マラソン'],
};

export const running = {
	// 今月の走行距離（km）。未入力なら null
	monthKm: null as number | null,
	// 直近の月ごとの距離（古い順、km）。空なら飾りのグラフを表示
	history: [] as number[],
	nextRace: '[大会名]',
};

export const certifications = {
	acquired: ['[資格名]', '[資格名]', '[資格名]', '[資格名]'],
	// 挑戦中の資格。なければ null
	current: { name: '[資格名]', progress: 60 } as { name: string; progress: number } | null,
};
