# LogChat 🗂️

個人の作業ログをチャット形式で記録するWebアプリです。

## 機能

- ✅ アカウント作成・ログイン（JWT認証）
- ✅ グループ作成（プロジェクト単位でまとめる）
- ✅ チャンネル作成（作業カテゴリ別）
- ✅ メッセージ送信（コードブロック対応）
- ✅ 画像添付（クリップボードペースト・ドラッグ&ドロップ対応）
- ✅ チャンネルアーカイブ（右クリックメニュー）
- ✅ PWA対応（モバイルからもインストール可能）

## セットアップ

### 1. Neonデータベース作成

1. [neon.tech](https://neon.tech) でアカウント作成
2. 新しいプロジェクトを作成
3. Connection Details から `DATABASE_URL` をコピー
4. Neon SQL Editorで `schema.sql` の内容を実行

### 2. 環境変数設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：
```
DATABASE_URL=postgresql://...（Neonからコピー）
JWT_SECRET=（openssl rand -base64 32 で生成）
```

### 3. ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

### 4. Vercelデプロイ

```bash
npm i -g vercel
vercel --prod
```

Vercelダッシュボードで環境変数を設定：
- DATABASE_URL
- JWT_SECRET

## 使い方

1. `/register` でアカウント作成
2. 「グループを追加」でプロジェクトグループを作成
3. グループ名の横の `+` でチャンネルを作成
4. コードは バッククォート3つ で囲むとコードブロックに
5. 画像はCtrl+V（クリップボード）またはドラッグ&ドロップ
6. チャンネルを右クリックでアーカイブ

## 技術スタック

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: Neon (PostgreSQL) + Drizzle ORM
- **Auth**: JWT (jose) + bcryptjs
- **Deploy**: Vercel
