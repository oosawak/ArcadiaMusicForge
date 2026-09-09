# Arcadia Music Forge

ゲームBGMをブラウザ上で作成・編集できる単一HTMLアプリです。

## Theory Assist（feature/theory-assist）

ROOT／SCALEとDegree進行から、既存のシード付きBGM生成へ和音を渡します。
17種類のスケール、小節別のコード／スケールガイド、伴奏配置、メロディ・ベース・アルペジオの個別生成に対応しています。

仕様・互換性・確認範囲は [THEORY_ASSIST_INTEGRATION.md](THEORY_ASSIST_INTEGRATION.md) を参照してください。
回帰テスト: `node tests/theory-assist.test.cjs`

## GitHub Pages

`index.html` をGitHub Pagesのルートで公開します。

GitHubの `Settings` → `Pages` で、Sourceを `Deploy from a branch`、Branchを `main`、Folderを `/ (root)` に設定してください。

公開URL: https://oosawak.github.io/ArcadiaMusicForge/
# ArcadiaMusicForge
