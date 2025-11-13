# Misskey Emoji Manager

[![CI](https://github.com/takashiTkg/misskey-emoji-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/takashiTkg/misskey-emoji-manager/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/misskey-emoji-manager.svg)](https://badge.fury.io/js/misskey-emoji-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Misskeyのカスタム絵文字をインポートするためのzipファイルを作成するツールです。

## 特徴

- フォルダ構造からカテゴリを自動検出
- ファイル名に基づいて絵文字名を自動生成
- 自動正規化機能（Misskeyの絵文字命名規則に準拠）
  - ハイフンをアンダーバーに自動変換
  - スペースを自動削除
  - 無効な文字を含むファイルを自動検出してスキップ
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
3. **自動正規化**: Misskeyの絵文字命名規則 `[a-zA-Z0-9_.]` に準拠するよう自動変換
   - **ハイフン変換**: ハイフンがアンダーバーに変換されます
     - 例: `inu-san.gif` → `animals_inu_san`
   - **スペース削除**: スペースが削除されます
     - 例: `with space.png` → `animals_withspace`
   - **無効なファイル検出**: 正規化後も無効な文字が含まれる場合はスキップしてコンソールに表示
     - 例: `絵文字.png` → `[NG2] Invalid emoji name (skipped): "animals_絵文字" (original: "絵文字.png")`
     - 例: `emoji@test.png` → スキップされます（`@`が無効な文字）
4. **エイリアス生成**: アンダーバーで分割してローマ字からひらがなに変換
   - 例: `animals_neko` → エイリアス: `["ねこ"]`
   - 例: `animals_inu_san` → エイリアス: `["いぬ", "さん", "いぬさん"]`

### ファイル名の取り扱い

このツールは3つのケースでファイルを処理します：

| ケース | 説明 | 例 | 結果 |
|--------|------|-----|------|
| **OK** | Misskeyの規則に最初から準拠 | `normal.png` | `✅ animals_normal.png` |
| **NG1** | 補正可能（ハイフン、スペース） | `with-hyphen.png`<br>`with space.png`<br>`my-emoji name.png` | `✅ animals_with_hyphen.png`<br>`✅ animals_withspace.png`<br>`✅ animals_my_emojiname.png` |
| **NG2** | 補正不可（無効な文字） | `絵文字.png`<br>`emoji@test.png`<br>`test#tag.png` | `❌ スキップ（コンソールにエラー表示）` |

### プログラムから使用する

```typescript
import {
  scanEmojiFiles,
  buildMeta,
  createEmojiZip,
  normalizeEmojiName,
  isValidEmojiName
} from 'misskey-emoji-manager';

// 絵文字ファイルをスキャン
const categoryMap = scanEmojiFiles('./emojis');

// メタデータを生成（無効なファイルは自動的にスキップされます）
const meta = buildMeta(categoryMap);

// zipファイルを作成
await createEmojiZip(meta, categoryMap, 'emoji-pack.zip');

// ユーティリティ関数
const normalized = normalizeEmojiName('my-emoji name'); // "my_emojiname"
const isValid = isValidEmojiName('test_emoji'); // true
const isInvalid = isValidEmojiName('test@emoji'); // false
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