# 画像準備ガイド

## 📸 必要な画像

### 昨日のトップ3投稿用の画像

以下の画像を `assets/` フォルダに配置してください：

```
tsubox-event/
└── assets/
    ├── daily-post-1.jpg  ← 1位の投稿スクリーンショット
    ├── daily-post-2.jpg  ← 2位の投稿スクリーンショット
    └── daily-post-3.jpg  ← 3位の投稿スクリーンショット
```

## 📋 スクリーンショットの撮り方

### 1. Facebookグループの投稿を開く

1. グループページにアクセス: https://www.facebook.com/groups/342734216486824
2. いいね数が多い投稿を探す
3. 投稿を開く

### 2. スクリーンショットを撮影

**撮影範囲:**
- ✅ 投稿者名
- ✅ 投稿内容（テキスト・画像）
- ✅ いいね数
- ❌ コメントは不要（含めても可）

**推奨サイズ:**
- 正方形（1:1）または縦長（4:5）
- 最小: 600x600px
- 推奨: 1200x1200px

### 3. ファイル名を変更して保存

```bash
# 1位の投稿
daily-post-1.jpg

# 2位の投稿
daily-post-2.jpg

# 3位の投稿
daily-post-3.jpg
```

### 4. assets フォルダに配置

```bash
# Windowsエクスプローラーで
c:\Users\daiki\Desktop\新しいフォルダー\tsubox-event\assets\

# または、コマンドで
cd tsubox-event\assets
# ここに画像ファイルをコピー
```

## 🎨 画像編集のヒント

### Windowsの「フォト」アプリで編集

1. 画像を右クリック → 「編集」
2. トリミング: 正方形（1:1）に切り抜き
3. 明るさ調整（必要に応じて）
4. 保存

### オンラインツール

- **Canva**: https://www.canva.com/
  - 正方形のテンプレートを使用
  - 1200x1200pxに設定
  - スクリーンショットをアップロード
  - トリミング・調整
  - ダウンロード

- **Photopea**（無料Photoshop代替）: https://www.photopea.com/

## 🔄 画像の更新方法

### プレビュー環境で確認する場合

1. `tsubox-event-preview` フォルダの `assets/` に画像を配置
2. GitHubにプッシュ

```bash
cd "c:\Users\daiki\Desktop\新しいフォルダー\tsubox-event-preview"
git add assets/daily-post-*.jpg
git commit -m "Add daily top3 post images"
git push
```

### 本番環境に反映する場合

1. `tsubox-event` フォルダの `feature/major-update` ブランチに画像を配置
2. コミット・プッシュ

```bash
cd "c:\Users\daiki\Desktop\新しいフォルダー\tsubox-event"
git add assets/daily-post-*.jpg
git commit -m "Add daily top3 post images"
git push origin feature/major-update
```

## 📝 管理画面での設定

画像を配置したら、管理画面で以下を入力：

1. https://daiki-ike.github.io/tsubox-event-preview/admin.html にアクセス
2. パスワード: `tsubox-admin`
3. 「昨日のトップ3投稿」セクションで：
   - **1位 投稿者名**: 山田太郎
   - **いいね数**: 245
   - **画像ファイル名**: `assets/daily-post-1.jpg`
4. 2位・3位も同様に入力
5. **GitHubに保存** をクリック

## ⚠️ 注意事項

1. **プライバシー保護**:
   - 個人が特定される情報（住所、電話番号など）は隠す
   - 必要に応じてモザイク処理

2. **著作権**:
   - 投稿者本人の承諾を得る
   - 社内イベントの範囲内で使用

3. **ファイルサイズ**:
   - 1枚あたり500KB以下を推奨
   - 大きすぎる場合は圧縮ツールで圧縮
   - おすすめツール: https://tinypng.com/

4. **画像形式**:
   - JPG または PNG
   - JPGを推奨（ファイルサイズが小さい）

## 🆘 トラブルシューティング

### 画像が表示されない場合

1. **ファイル名を確認**:
   ```
   ✅ daily-post-1.jpg
   ❌ Daily-Post-1.jpg  （大文字小文字が違う）
   ❌ daily-post-1.JPG  （拡張子が大文字）
   ```

2. **パスを確認**:
   ```
   ✅ assets/daily-post-1.jpg
   ❌ daily-post-1.jpg  （assetsフォルダがない）
   ```

3. **ブラウザのキャッシュをクリア**:
   - Chrome: Ctrl + Shift + Delete
   - キャッシュをクリアして再読み込み

4. **開発者ツールでエラーを確認**:
   - F12 キーを押す
   - Console タブでエラーメッセージを確認

## 📞 サポート

質問がある場合は、社長またはIT担当者にお問い合わせください。
