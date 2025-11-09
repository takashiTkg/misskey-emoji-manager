# Misskey Emoji Manager

Misskeyのカスタム絵文字をインポートするためのzipファイルを作成するツールです。

## 特徴

- フォルダ構造からカテゴリを自動検出
- ファイル名に基づいて絵文字名を自動生成
- ハイフンをアンダーバーに自動変換
- ローマ字からひらがなへの変換でエイリアスを自動生成
- meta.jsonとzipファイルを生成

## インストール

```bash
npm install -g misskey-emoji-manager
```

## 使い方

### コマンドライン

```bash
misskey-emoji-manager pack <入力ディレクトリ> [出力zipファイル]
```

**例:**

```bash
misskey-emoji-manager pack ./emojis emoji-pack.zip
```

### ディレクトリ構造

入力ディレクトリは以下のような構造です

```
emojis/
├── animals/
│   ├── neko.png
│   ├── inu-san.gif
│   └── tori.png
├── food/
│   ├── ramen.png
│   └── sushi-maki.png
└── reactions/
    ├── yatta.png
    └── ganbaru-zo.png
```

各サブディレクトリの名前がカテゴリとして使用されます。

### 処理内容

1. **カテゴリ検出**: サブディレクトリ名がカテゴリになります
2. **プレフィックス追加**: カテゴリ名がプレフィックスとして絵文字名に追加されます
   - 例: `animals/neko.png` → `animals_neko`
3. **ハイフン変換**: ハイフンがアンダーバーに変換されます
   - 例: `inu-san.gif` → `animals_inu_san`
4. **エイリアス生成**: アンダーバーで分割してローマ字からひらがなに変換
   - 例: `animals_neko` → エイリアス: `["ねこ"]`
   - 例: `animals_inu_san` → エイリアス: `["いぬ", "さん", "いぬさん"]`

### プログラムから使用する

```typescript
import { scanEmojiFiles, buildMeta, createEmojiZip } from 'misskey-emoji-manager';

// 絵文字ファイルをスキャン
const categoryMap = scanEmojiFiles('./emojis');

// メタデータを生成
const meta = buildMeta(categoryMap);

// zipファイルを作成
await createEmojiZip(meta, categoryMap, 'emoji-pack.zip');
```

## 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 開発モード
npm run dev pack <入力ディレクトリ>
```

## ライセンス

MIT

## 参考

- [misskey-emopack](https://github.com/ikasoba/misskey-emopack) - zip形式とmeta.jsonの構造を参考にしました
- [@koozaki/romaji-conv](https://www.npmjs.com/package/@koozaki/romaji-conv) - ローマ字→ひらがな変換に使用