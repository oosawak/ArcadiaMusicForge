# Arcadia Music Forge Mac引継ぎ

## 現在の状態

- ブランチ: `main`
- ブラウザ版の本体は `index.html` 一枚構成です。
- `assets/arcadia-title-banner.png` は画面タイトル用、`assets/arcadia-app-icon.png` はTauri用アイコンです。
- Tauri v2のWindows/Android化の土台を `src-tauri/` に追加しています。
- スタンドアローン版ではChrome Geminiとwtrmaxを無効化します。
- ブラウザ版では既存のGemini/wtrmax機能を維持します。

## Macで取得後

```bash
git clone <repository-url>
cd ArcadiaMusicForge
npm install
npm run tauri -- info
```

Rustが未導入ならrustupでstable toolchainを入れます。

```bash
rustup default stable
```

## Tauri起動・ビルド

```bash
npm run tauri -- dev
npm run tauri -- build
```

フロントエンドは `dist/index.html` に同期してビルドします。現在の構成では、ビルド前に次を実行してください。

```bash
mkdir -p dist/assets
cp index.html dist/index.html
cp assets/* dist/assets/
```

Mac向け成果物は `src-tauri/target/release/bundle/` に生成されます。

## MIDI保存

Tauri版ではDialog/FSプラグイン経由で保存する実装を追加済みです。古いexeや古いビルドでは反映されないため、必ず再ビルドしてください。

## 確認済みテスト

```bash
node tests/theory-assist.test.cjs
node tests/playback.test.cjs
node tests/midi-drums.test.cjs
```

## 注意

- GitHubへのpushは実行しません。Mac側でclone後、必要に応じてpushしてください。
- Chrome専用Gemini APIと `http://wtrmax:8000` はスタンドアローン版では利用できません。
- 既存の7トラック、48小節、MIDI/WAV、保存/読込、Theory Assist、Generatorを維持してください。

