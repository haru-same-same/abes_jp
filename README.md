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
