# AI副業ラボ

初心者向けの日本語AIツール比較・副業ガイドです。Astro + TypeScript で静的HTMLを生成します。プロンプト生成はブラウザ内で完結し、外部APIやAPIキーは不要です。

## ローカル開発

Node.js 22.12 以上を使用してください。nvm を使う場合は `nvm use` で Node.js 22 を選べます。

```sh
npm install
npm run dev
```

ターミナルに表示されるローカルURLを開きます。

```sh
npm run check
npm run build
npm run preview
```

ビルド出力は `dist/` です。CIや公開時はロックファイルに基づく `npm ci` で再現できます。

## 公開

GitHubリポジトリを接続し、以下の設定を使用します。

| 設定 | Cloudflare Pages | Vercel |
| --- | --- | --- |
| プロジェクトルート | リポジトリルート | リポジトリルート |
| フレームワーク | Astro | Astro |
| Node.js | 22 | 22.x |
| ビルドコマンド | `npm run build` | `npm run build` |
| 出力先 | `dist` | `dist` |

1. Cloudflare Pages では Git に接続してプロジェクトを作成します。Vercel では同リポジトリをインポートします。
2. 本番の環境変数 `SITE_URL` に公開URLのHTTPSオリジンを指定します。独自ドメインを使う場合はそのURLを指定します。
3. ビルドして公開します。初回に公開URLが確定する場合は、環境変数を設定して再ビルドします。
4. 公開先でトップページ、`/robots.txt` と `/sitemap-index.xml` を確認します。

ローカルで公開用ビルドを再現する場合は `.env.example` を `.env` にコピーし、`SITE_URL` を設定します。URL未設定時は canonical・サイトマップを出力せず、検索エンジンへの登録を抑止します。プレビュー環境では `SITE_URL` を空にする場合、共有の `.env` にも設定しないでください。

## コンテンツの更新

- AIツールは `src/data/tools.json`、ガイドは `src/data/guides.json` を編集します。`id` はURLに使用するため、公開済みの値は維持してください。記事を修正した場合は `updated`（YYYY-MM-DD）も更新します。
- 料金・無料枠・商用条件は利用する地域とプランの公式情報を参照し、確認できない場合は「要確認」とします。
- 下書きはPRでレビューし、公式情報・権利・リンクを確認してからマージします。販売・広告の導入時は、掲載箇所にPR表記を付け、提携リンクに `rel="sponsored noopener noreferrer"` を設定します。
- 運営者情報とポリシーは `src/data/site.ts` にあります。問い合わせの初期窓口は公開の GitHub Issues です。非公開の問い合わせ先を用意した際は `src/pages/[info].astro` と案内を更新してください。
