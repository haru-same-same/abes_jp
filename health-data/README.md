# health-data

Samsung Health の書き出しデータを置くフォルダ。中身は git に入らない（この README だけ管理対象）。

1. Samsung Health の「設定 → 個人データをダウンロード」で書き出す
2. 書き出されたフォルダ（または zip）を、このフォルダにそのままコピーする
3. リポジトリのルートで `npm run update-runs` を実行する

一番新しいフォルダ（または zip）が自動で使われる。古いものは消してかまわない。
