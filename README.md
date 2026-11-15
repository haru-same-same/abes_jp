# abes.jp

[abes.jp](https://abes.jp) のソースコード。[Astro](https://astro.build) で構築。

## 開発

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に出力
npm run preview  # ビルド結果を確認
```

ブログ記事は `src/content/blog/` に Markdown で追加する。

## デプロイ

`master` へ push すると GitHub Actions（`.github/workflows/deploy.yml`）で GitHub Pages にデプロイされる。

## 走行距離の更新（Samsung Health から取り込み）

トップページの「走行距離」は `src/data/runs.json` の月ごとの合計を表示する。月に1回くらい、次の手順で更新する。

1. Samsung アカウントの「個人情報のダウンロード」で Samsung Health のデータをダウンロードする
2. 届いた zip のうち `samsungcloud_*_access.zip` を `health-data/` に置く（展開しない）
3. `npm run update-runs` を実行し、聞かれたら zip のパスワードを入力する

`update-runs` は `health-data/` の一番新しい zip から `Exercise/Exercise.csv` だけを取り出して集計し、`src/data/runs.json` を更新し、そのファイルだけをコミットして push する。集計だけしたいときは `npm run import-runs -- <Exercise.csv>` を使う。展開には 7z（`brew install p7zip`）が必要。

`health-data/` の中身は `.gitignore` で除外していて、コミットされない（書き出しには心拍数などの健康データが含まれるため）。リポジトリに入るのは月ごとの合計距離だけ。
