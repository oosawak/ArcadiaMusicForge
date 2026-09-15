# wtrmax 起動・CORS設定

Arcadia Music ForgeのSOUND DESIGNからwtrmaxを呼び出すための確認手順です。

## 1. wtrmaxを起動

wtrmaxのAPIプロジェクトのフォルダで、使用しているフレームワークに応じて起動します。

FastAPIの場合:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

Flaskの場合:

```powershell
python app.py
```

`/generate` が `POST` を受け付け、MP3などの音声データを返すことを確認します。

## 2. CORSを許可

ArcadiaのURLは通常 `http://127.0.0.1:8765` です。`http://localhost:8765` で開く場合もあるため、両方を許可します。

FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8765",
        "http://localhost:8765",
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
```

Flask:

```python
from flask_cors import CORS

CORS(app, origins=[
    "http://127.0.0.1:8765",
    "http://localhost:8765",
])
```

設定を変更した後は、wtrmaxを再起動してください。

## 3. 接続確認

WindowsのPowerShellで次を実行します。

```powershell
Invoke-WebRequest http://wtrmax:8000
```

`wtrmax`という名前が解決できない場合は、次を試します。

```powershell
Invoke-WebRequest http://127.0.0.1:8000
```

名前で接続できない場合は、Arcadia Music Forgeの接続先を
`http://127.0.0.1:8000/generate` に変更してください。

## 4. Arcadiaでの使用

1. SOUND DESIGNを開く
2. 「短い音声を生成」に音の説明を入力
3. 秒数を指定
4. 「生成してサンプラーへ」を押す

成功すると、MP3が選択中トラックのPCM SAMPLERへ読み込まれます。

## よくある原因

- wtrmaxが起動していない
- ポート8000が別のアプリで使用されている
- CORS設定後にwtrmaxを再起動していない
- ArcadiaのURLとCORSの許可元が一致していない
- `wtrmax`というホスト名がWindowsで解決できない
- ブラウザの開発者ツールにCORSエラーが表示されている

