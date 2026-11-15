# health-data

Samsung Health の書き出しデータを置くフォルダ。中身は git に入らない（この README だけ管理対象）。

1. Samsung アカウントの「個人情報のダウンロード」で Samsung Health のデータを申請してダウンロードする
2. 届いた zip のうち `samsungcloud_*_access.zip` だけを、このフォルダにそのまま置く（展開しない）
3. リポジトリのルートで `npm run update-runs` を実行し、聞かれたら zip のパスワードを入力する

- zip から取り出すのは `Exercise/Exercise.csv`（運動記録）だけ。展開には 7z を使う（`brew install p7zip`）
- ファイル名の日付が一番新しい zip が使われる。古い zip や取り出したフォルダは消してかまわない
- `SamsungHealthAnalytics_*.zip` と `samsunghealth_*.zip` は使わない
