# Arcadia Music Forge 引き継ぎ指示

## プロジェクト

- パス: `C:\Users\teacher\Documents\Codex\ArcadiaMusicForge`
- 現在のブランチ: `main`
- 目的: 既存機能を壊さず、GENERATOR／THEORY ASSIST／再生／音声素材機能を発展させる
- push は利用者が行う。作業前に `git status --short --branch` と最新コミットを確認する。

## 現在実装済み

- 48小節・7トラックの作曲、ピアノロール、パターン（INTRO/A/B/BREAK/CLIMAX/TURN）
- MIDI/WAV保存、プロジェクト保存・読込、Undo、PCM SAMPLER
- AudioContext時刻を基準にした先読み再生。安定再生の先読みは400/600/800/1000msに対応
- ループ範囲。通常は1〜48小節、試聴構成はINTRO→A→B→BREAK→CLIMAX→TURN後に5小節へ戻る
- GENERATORとTHEORY ASSISTの設定を分離
- 情景・ムード、音楽ジャンル、音源スタイルを保存
- 音楽ジャンル別の伴奏編成（ロックのリフ、ダンスのビート、ローファイの余白、アンビエントの持続音など）
- 音楽ジャンル: ポップ、ロック、ヒップホップ、トラップ、R&B、EDM、ハウス、テクノ、ドラムンベース、ファンク、ジャズ、ボサノバ、ローファイ、アンビエント等
- 音源スタイル: 通常、NES風、SNES風、メガドライブ風、初代PlayStation風
- 主旋律パターンは従来の16種類に加え、形×音域×反行の追加パターンを収録。自動選択はSEEDで決定
- 進行パレットと進行モードを拡張。進行欄の「自動選択（ジャンルに合わせる）」だけが自動選択を行う
- 進行モード: 指定進行、おまかせ、展開あり、コード少なめ、2コード反復、小さな変化、問いと応答、サビで明るく、終盤に緊張
- 「おまかせ」でも具体的な進行を選んでいればそれを基準にする。「自動選択」の場合のみジャンル対応進行を選ぶ
- SOUND DESIGNにwtrmax連携欄を追加。説明文と秒数を指定して `POST http://wtrmax:8000/generate` し、MP3を選択中トラックのPCM SAMPLERへ読み込む

## wtrmax連携の注意

- `wtrmax:8000` はこの環境からは接続確認できなかった。実ブラウザではwtrmaxの起動とCORS許可が必要
- API body: `prompt`, `negative_prompt`, `duration`（0.5〜30秒）, `steps: 50`
- 接続失敗時は画面に「接続できません」と表示する
- 生成MP3を `loadTrackSample` と `decodeAudioFile` で読み込む。既存のファイル読み込み処理を置き換えない

## 重要な制約

- 既存の生成器、THEORY ASSIST、7トラック、保存形式、MIDI/WAV、Samplerを壊さない
- 新機能は既存プロジェクト互換を維持する
- `randomProgression` と `randomMelodyContour` は保存データ互換用に内部保持しているが、UIでは自動選択欄を主にする
- main以外のブランチを勝手に変更しない。pushしない
- 既存の未コミット変更をリセット・破棄しない

## 検証

作業後に実行する:

```text
node tests/theory-assist.test.cjs
node tests/playback.test.cjs
node tests/midi-drums.test.cjs
git diff --check
```

## 次に確認したいこと

- ブラウザでwtrmax音声生成→PCM SAMPLER取り込みを実機確認（CORSを含む）
- 進行欄の自動選択・具体的選択と「おまかせ」「展開あり」の表示／保存が一致するか確認
- ジャンル別の伴奏が実際に聴感上変化するか確認
- 必要ならこの指示書と実装をコミットする。pushは利用者が行う
