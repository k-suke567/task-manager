# タスクマネージャー

締切、優先度、種類、推定時間を管理できる個人向けタスク管理アプリです。

## 使い方の種類

### Cloudflare Pagesで公開する

PCを閉じていても常に使いたい場合はこちらを使います。

1. このプロジェクトをGitHubにアップロードします。
2. Cloudflare Dashboardで **Workers & Pages** を開きます。
3. **Create application** から **Pages** を選び、GitHubリポジトリを接続します。
4. Build settingsは次のようにします。

```text
Framework preset: None
Build command: 空欄
Build output directory: /
```

5. Cloudflare D1でデータベースを作成します。
6. Pagesプロジェクトの設定でD1 bindingを追加します。

```text
Variable name: DB
Database: 作成したD1データベース
```

7. 再デプロイします。

Cloudflare Pagesでは `functions/api/sync/[action].js` が同期APIとして動き、D1に共有アカウントとタスクを保存します。

### ローカルで使う

PC上だけで試す場合はNode.jsでサーバーを起動します。

```bash
node server.js
```

起動後、次のURLを開きます。

```text
http://localhost:3000/task.html
```

ローカル版は `data/sync-store.json` に保存します。

## 共有アカウント

- IDは3〜40文字の英数字、`_`、`-`が使えます。
- パスワードは12桁以上が必要です。
- `新規作成`を押すと、現在この端末にあるタスクも含めて共有アカウントを作成します。
- `ログイン`を押すと、サーバー側のタスクとこの端末に残っているタスクを結合して同期します。
- 同じIDとパスワードで別端末からログインすると、同じタスクを読み込めます。
- パスワードは平文では保存せず、サーバー側でハッシュ化して保存します。

## ファイル構成

```text
task.html
style.css
script.js
server.js
functions/api/sync/[action].js
_routes.json
package.json
README.md
```
